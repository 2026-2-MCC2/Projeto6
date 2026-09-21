import Network from './Network'
import NewEvent from './NewEvent'
import Overview from './Overview'
import Proposals from './Proposals'

export const organizerPages = {
  home: Overview,
  events: Overview,
  new: NewEvent,
  proposals: Proposals,
  network: Network,
}
