// Shape returned by every server action (and by the API helper in lib/api.ts)
export type ActionResponse<T = void> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string }

export function actionSuccess<T>(data?: T, message?: string): ActionResponse<T> {
  return { success: true, data, message }
}

export function actionError(error: string): ActionResponse<never> {
  return { success: false, error }
}
