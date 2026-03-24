const botaoAlterarTema = document.getElementById('botao-alterar-tema')
const body = document.querySelector('body')
const imagemBotaoTrocaDeTema = document.querySelector('.imagem-botao')
const listagemPokemon = document.querySelector('.listagem-pokemon')
const campoBuscaPokemon = document.getElementById('busca-pokemon')
const filtroTipo = document.getElementById('filtro-tipo')
const filtroRegiao = document.getElementById('filtro-regiao')

const URL_BASE = 'https://pokeapi.co/api/v2/pokemon'

const regioes = {
    kanto: { inicio: 1, fim: 151 },
    johto: { inicio: 152, fim: 251 },
    hoenn: { inicio: 252, fim: 386 },
    sinnoh: { inicio: 387, fim: 493 },
    unova: { inicio: 494, fim: 649 },
    kalos: { inicio: 650, fim: 721 },
    alola: { inicio: 722, fim: 809 },
    galar: { inicio: 810, fim: 905 },
    paldea: { inicio: 906, fim: 1025 }
}

const tiposTraduzidos = {
    grass: { classe: 'grama', nome: 'Grama' },
    poison: { classe: 'veneno', nome: 'Veneno' },
    fire: { classe: 'fogo', nome: 'Fogo' },
    water: { classe: 'agua', nome: 'Agua' },
    bug: { classe: 'inseto', nome: 'Inseto' },
    flying: { classe: 'voador', nome: 'Voador' },
    electric: { classe: 'eletrico', nome: 'Eletrico' },
    normal: { classe: 'normal', nome: 'Normal' },
    psychic: { classe: 'psiquico', nome: 'Psiquico' },
    ground: { classe: 'terra', nome: 'Terra' },
    rock: { classe: 'pedra', nome: 'Pedra' },
    fairy: { classe: 'fada', nome: 'Fada' },
    fighting: { classe: 'lutador', nome: 'Lutador' },
    ghost: { classe: 'fantasma', nome: 'Fantasma' },
    ice: { classe: 'gelo', nome: 'Gelo' },
    dragon: { classe: 'dragao', nome: 'Dragao' },
    dark: { classe: 'sombrio', nome: 'Sombrio' },
    steel: { classe: 'aco', nome: 'Aco' }
}

let pokemonsDaRegiao = []

const formatarNome = (nome) => nome.charAt(0).toUpperCase() + nome.slice(1)

const formatarNumero = (numero) => `#${String(numero).padStart(3, '0')}`

const limparDescricao = (texto) => texto.replace(/[\n\f]/g, ' ')

const fetchJson = async (url) => {
    const resposta = await fetch(url)
    if (!resposta.ok) {
        throw new Error(`Falha na requisicao: ${resposta.status}`)
    }
    return resposta.json()
}

const obterDescricao = (speciesData) => {
    const descricaoPtBr = speciesData.flavor_text_entries.find((entrada) => entrada.language.name.toLowerCase() === 'pt-br')
    if (descricaoPtBr) {
        return limparDescricao(descricaoPtBr.flavor_text)
    }

    const descricaoPt = speciesData.flavor_text_entries.find((entrada) => entrada.language.name === 'pt')
    if (descricaoPt) {
        return limparDescricao(descricaoPt.flavor_text)
    }

    const descricaoEn = speciesData.flavor_text_entries.find((entrada) => entrada.language.name === 'en')
    if (descricaoEn) {
        return limparDescricao(descricaoEn.flavor_text)
    }

    return 'Descricao indisponivel no momento.'
}

const obterClasseENomeTipo = (tipoApi) => {
    const tipoConvertido = tiposTraduzidos[tipoApi]

    if (!tipoConvertido) {
        return { classe: '', nome: formatarNome(tipoApi) }
    }

    return tipoConvertido
}

const montarTipos = (tiposPokemon) => tiposPokemon
    .map(({ type }) => {
        const tipo = obterClasseENomeTipo(type.name)
        const classeTipo = tipo.classe ? ` ${tipo.classe}` : ''
        return `<li class="tipo${classeTipo}">${tipo.nome}</li>`
    })
    .join('')

const criarCartaoPokemon = (pokemon) => {
    const card = document.createElement('li')
    card.classList.add('cartao-pokemon')

    const sprite = pokemon.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default
        || pokemon.sprites.other?.showdown?.front_default
        || pokemon.sprites.other?.['official-artwork']?.front_default
        || pokemon.sprites.front_default

    card.innerHTML = `
        <div class="informacoes">
            <span>${formatarNome(pokemon.name)}</span>
            <span>${formatarNumero(pokemon.id)}</span>
        </div>
        <img src="${sprite}" alt="${formatarNome(pokemon.name)}" class="gif">
        <ul class="tipos">
            ${montarTipos(pokemon.types)}
        </ul>
        <p class="descricao">${pokemon.descricao}</p>
    `

    return card
}

const mostrarMensagemStatus = (mensagem, classe = '') => {
    const classeFinal = classe ? ` ${classe}` : ''
    listagemPokemon.innerHTML = `<li class="mensagem-status${classeFinal}">${mensagem}</li>`
}

const atualizarOpcoesTipo = (pokemons) => {
    const tiposUnicos = new Set()

    pokemons.forEach((pokemon) => {
        pokemon.types.forEach(({ type }) => {
            tiposUnicos.add(type.name)
        })
    })

    const valorSelecionado = filtroTipo.value
    filtroTipo.innerHTML = '<option value="todos">Todos os tipos</option>'

    Array.from(tiposUnicos)
        .sort((a, b) => a.localeCompare(b))
        .forEach((tipoApi) => {
            const tipo = obterClasseENomeTipo(tipoApi)
            const option = document.createElement('option')
            option.value = tipoApi
            option.textContent = tipo.nome
            filtroTipo.appendChild(option)
        })

    if (valorSelecionado !== 'todos' && tiposUnicos.has(valorSelecionado)) {
        filtroTipo.value = valorSelecionado
    }
}

const renderizarPokemons = (pokemons) => {
    listagemPokemon.innerHTML = ''

    if (!pokemons.length) {
        mostrarMensagemStatus('Nenhum Pokemon encontrado para os filtros aplicados.')
        return
    }

    pokemons.forEach((pokemon) => {
        const card = criarCartaoPokemon(pokemon)
        listagemPokemon.appendChild(card)
    })
}

const aplicarFiltros = () => {
    const termoBusca = campoBuscaPokemon.value.trim().toLowerCase()
    const tipoSelecionado = filtroTipo.value

    const pokemonsFiltrados = pokemonsDaRegiao.filter((pokemon) => {
        const bateNome = pokemon.name.includes(termoBusca)
        const bateTipo = tipoSelecionado === 'todos'
            || pokemon.types.some(({ type }) => type.name === tipoSelecionado)

        return bateNome && bateTipo
    })

    renderizarPokemons(pokemonsFiltrados)
}

const obterIdsDaRegiao = (regiao) => {
    const faixa = regioes[regiao]

    if (!faixa) {
        return []
    }

    const quantidade = faixa.fim - faixa.inicio + 1
    return Array.from({ length: quantidade }, (_, indice) => faixa.inicio + indice)
}

async function carregarPokemonsDaRegiao(regiao) {
    mostrarMensagemStatus('Carregando pokemons...')

    try {
        const ids = obterIdsDaRegiao(regiao)

        if (!ids.length) {
            mostrarMensagemStatus('Regiao invalida selecionada.', 'erro')
            return
        }

        const promessas = ids.map((id) => {
            return fetchJson(`${URL_BASE}/${id}`)
        })

        const pokemons = await Promise.all(promessas)

        const descricoes = await Promise.all(
            pokemons.map((pokemon) => fetchJson(pokemon.species.url))
        )

        pokemonsDaRegiao = pokemons.map((pokemon, indice) => {
            return {
                ...pokemon,
                descricao: obterDescricao(descricoes[indice])
            }
        })

        atualizarOpcoesTipo(pokemonsDaRegiao)
        aplicarFiltros()
    } catch (erro) {
        mostrarMensagemStatus('Nao foi possivel carregar os pokemons. Tente novamente.', 'erro')
        console.error('Erro ao carregar pokemons da PokeAPI:', erro)
    }
}

filtroRegiao.addEventListener('change', (evento) => {
    carregarPokemonsDaRegiao(evento.target.value)
})

filtroTipo.addEventListener('change', aplicarFiltros)

campoBuscaPokemon.addEventListener('input', aplicarFiltros)

botaoAlterarTema.addEventListener('click', () => {
    const modoEscuroAtivo = body.classList.contains('modo-escuro')
    body.classList.toggle('modo-escuro')
    if(modoEscuroAtivo){ 
        imagemBotaoTrocaDeTema.setAttribute('src', './src/images/sun.png')
    }else{
        imagemBotaoTrocaDeTema.setAttribute('src', './src/images/moon.png')
    }
})

carregarPokemonsDaRegiao(filtroRegiao.value)