import { adminPages } from './admin'
import { organizerPages } from './organizer'
import { supplierPages } from './supplier'
import Profile from './Profile'

export const pagesByRole = {
  admin: adminPages,
  organizer: organizerPages,
  supplier: supplierPages,
}

pagesByRole.organizer.account = Profile
pagesByRole.admin.account = Profile
pagesByRole.supplier.account = Profile
