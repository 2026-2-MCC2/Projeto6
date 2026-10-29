import Evento from './Evento'
import Events from './Events'
import Network from './Network'
import NewEvent from './NewEvent'
import Overview from './Overview'

export const organizerPages = {
  home: Overview,
  events: Events,
  new: NewEvent,
  // tela de um evento, aberta pela lista (nao aparece no menu)
  evento: Evento,
  network: Network,
}
