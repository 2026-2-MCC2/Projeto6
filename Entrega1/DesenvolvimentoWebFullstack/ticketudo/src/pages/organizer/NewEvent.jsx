import Carregando from '../../components/Carregando'
import PageHeading from '../../components/PageHeading'
import EventoForm from './EventoForm'
import { catalogo, eventos } from '../../api'
import { useRecurso } from '../../hooks/useRecurso'
import { useApp } from '../../state/useApp'

// Cria o evento e leva para a tela dele, onde entram os itens de custo e os
// outros custos (FLX-02).
export default function NewEvent({ profile, onNavigate }) {
  const { dispatch } = useApp()
  const categorias = useRecurso(() => catalogo.categorias())

  if (categorias.carregando || categorias.erro) {
    return <Carregando erro={categorias.erro} aoTentarDeNovo={categorias.recarregar} />
  }

  async function criar(dados) {
    const r = await eventos.criar(dados)
    dispatch({ type: 'aviso', texto: 'Evento criado. Agora cadastre os itens de custo.' })
    onNavigate('evento', r.id_evento)
  }

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Adicionar evento"
        description="Cadastre o período, o local, o público e a margem. Depois você monta os custos."
      />
      <EventoForm categorias={categorias.dados} rotuloBotao="Criar evento" onSalvar={criar} />
    </>
  )
}
