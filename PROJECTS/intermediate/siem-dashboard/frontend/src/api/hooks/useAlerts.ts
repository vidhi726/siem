// ===================
// ©AngelaMos | 2026
// useAlerts.ts
//
// React Query hooks for alerts: list, detail, status updates, SOAR actions, and MITRE matrix
// ===================

import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import type {
  Alert,
  AlertDetail,
  AlertQueryParams,
  AlertStatusUpdateRequest,
  PaginatedResponse,
  SoarActionExecuteRequest,
} from '@/api/types'
import { API_ENDPOINTS, PAGINATION, QUERY_KEYS } from '@/config'
import { apiClient, QUERY_STRATEGIES } from '@/core/lib'
import { useNotificationStore } from '@/core/stores'

export const alertQueries = {
  all: () => QUERY_KEYS.ALERTS.ALL,
  list: (params: AlertQueryParams = {}) => QUERY_KEYS.ALERTS.LIST(params),
  byId: (id: string) => QUERY_KEYS.ALERTS.BY_ID(id),
  mitreMatrix: () => QUERY_KEYS.ALERTS.MITRE_MATRIX(),
} as const

export const useAlerts = (
  params: AlertQueryParams = {}
): UseQueryResult<PaginatedResponse<Alert>, Error> => {
  const page = params.page ?? PAGINATION.DEFAULT_PAGE
  const perPage = params.per_page ?? PAGINATION.DEFAULT_SIZE
  const fullParams = { ...params, page, per_page: perPage }

  return useQuery({
    queryKey: alertQueries.list(fullParams),
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<Alert>>(
        API_ENDPOINTS.ALERTS.LIST,
        { params: fullParams }
      )
      return response.data
    },
    ...QUERY_STRATEGIES.frequent,
  })
}

export const useAlertDetail = (
  alertId: string
): UseQueryResult<AlertDetail, Error> => {
  return useQuery({
    queryKey: alertQueries.byId(alertId),
    queryFn: async () => {
      const response = await apiClient.get<AlertDetail>(
        API_ENDPOINTS.ALERTS.BY_ID(alertId)
      )
      return response.data
    },
    enabled: alertId.length > 0,
  })
}

export const useUpdateAlertStatus = (
  alertId: string
): UseMutationResult<Alert, Error, AlertStatusUpdateRequest, { previousDetail?: AlertDetail }> => {
  const queryClient = useQueryClient()
  const dismissActiveAlert = useNotificationStore.getState().dismissActiveAlert

  return useMutation({
    mutationFn: async (payload: AlertStatusUpdateRequest) => {
      const response = await apiClient.patch<Alert>(
        API_ENDPOINTS.ALERTS.STATUS(alertId),
        payload
      )
      return response.data
    },
    onMutate: async (newStatusPayload) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: alertQueries.byId(alertId) })
      const previousDetail = queryClient.getQueryData<AlertDetail>(alertQueries.byId(alertId))

      if (previousDetail) {
        queryClient.setQueryData<AlertDetail>(alertQueries.byId(alertId), {
          ...previousDetail,
          alert: {
            ...previousDetail.alert,
            status: newStatusPayload.status,
            notes: newStatusPayload.notes ?? previousDetail.alert.notes,
          },
        })
      }

      // If moved out of new, dismiss from repeat audio queue
      if (['acknowledged', 'investigating', 'resolved', 'false_positive'].includes(newStatusPayload.status)) {
        dismissActiveAlert(alertId)
      }

      return { previousDetail }
    },
    onSuccess: (data: Alert): void => {
      queryClient.invalidateQueries({ queryKey: alertQueries.all() })
      queryClient.setQueryData(alertQueries.byId(alertId), (prev: AlertDetail | undefined) => {
        if (!prev) return prev
        return {
          ...prev,
          alert: {
            ...prev.alert,
            status: data.status,
            notes: data.notes,
            acknowledged_by: data.acknowledged_by,
          },
        }
      })
      toast.success('Alert status transitioned to ' + data.status.replace('_', ' '))
    },
    onError: (error: Error, _vars, context): void => {
      if (context?.previousDetail) {
        queryClient.setQueryData(alertQueries.byId(alertId), context.previousDetail)
      }
      toast.error(error.message)
    },
  })
}

export const useExecuteSoarAction = (
  alertId: string
): UseMutationResult<any, Error, SoarActionExecuteRequest> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: SoarActionExecuteRequest) => {
      const response = await apiClient.post(
        API_ENDPOINTS.ALERTS.SOAR(alertId),
        payload
      )
      return response.data
    },
    onSuccess: (data: any): void => {
      queryClient.invalidateQueries({ queryKey: alertQueries.byId(alertId) })
      toast.success(`🛡️ SOAR Action Executed: ${data.description ?? data.action}`)
    },
    onError: (error: Error): void => {
      toast.error(`SOAR Execution Failed: ${error.message}`)
    },
  })
}

export const useMitreMatrix = (): UseQueryResult<any[], Error> => {
  return useQuery({
    queryKey: alertQueries.mitreMatrix(),
    queryFn: async () => {
      const response = await apiClient.get<any[]>(
        API_ENDPOINTS.ALERTS.MITRE_MATRIX
      )
      return response.data
    },
    staleTime: 30000,
  })
}
