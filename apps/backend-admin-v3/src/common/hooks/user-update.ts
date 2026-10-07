import { CollectionBeforeChangeHook, GlobalBeforeChangeHook } from 'payload'

export const setUserCreatedOrUpdatedBy = <T extends { created_by?: string; updated_by?: string }>(
  operation: 'create' | 'update',
  data: T,
  id?: string,
) => {
  if (operation === 'create' && id) {
    data.created_by = id
    data.updated_by = id
    return data
  }
  if (operation === 'update' && id) {
    data.updated_by = id
    return data
  }

  return data
}

export const setUserCreatedOrUpdatedByCollection: CollectionBeforeChangeHook = async ({
  req,
  operation,
  data,
}) => {
  const userId = req?.user?.id
  if (!userId) return data

  return setUserCreatedOrUpdatedBy(operation, data, userId)
}

export const setUserCreatedOrUpdatedByGlobal: GlobalBeforeChangeHook = async ({ req, data }) => {
  const userId = req?.user?.id

  if (!userId) return data

  return setUserCreatedOrUpdatedBy('update', data, userId)
}
