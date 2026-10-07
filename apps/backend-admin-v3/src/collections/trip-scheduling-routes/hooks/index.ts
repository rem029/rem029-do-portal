// apps/backend-admin-v3/src/collections/trip-scheduling-routes/hooks/index.ts
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { beforeDelete } from './beforeDelete'

// Ensure this variable name is EXACTLY tripSchedulingRoutesHooks
export const tripSchedulingRoutesHooks = {
  beforeChange: [setUserCreatedOrUpdatedByCollection],
  beforeDelete: [beforeDelete],
}
