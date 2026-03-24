const botaoAlterarTema = document.getElementById('botao-alterar-tema')
const body = document.querySelector('body')
const imagemBotaoTrocaDeTema = document.querySelector('.imagem-botao')
const listagemPokemon = document.querySelector('.listagem-pokemon')
const campoBuscaPokemon = document.getElementById('busca-pokemon')
const filtroTipo = document.getElementById('filtro-tipo')
const filtroRegiao = document.getElementById('filtro-regiao')
const modalPokemon = document.getElementById('modal-pokemon')
const modalFechar = document.getElementById('modal-fechar')
const modalPokemonNome = document.getElementById('modal-pokemon-nome')
const modalPokemonNumero = document.getElementById('modal-pokemon-numero')
const modalPokemonSprite = document.getElementById('modal-pokemon-sprite')
const modalPokemonStatus = document.getElementById('modal-pokemon-status')
const modalPokemonSprites = document.getElementById('modal-pokemon-sprites')

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
    grass: { classe: 'grama', nome: 'Grama', icone: 'spa' },
    poison: { classe: 'veneno', nome: 'Veneno', icone: 'skull' },
    fire: { classe: 'fogo', nome: 'Fogo', icone: 'local_fire_department' },
    water: { classe: 'agua', nome: 'Agua', icone: 'water_drop' },
    bug: { classe: 'inseto', nome: 'Inseto', icone: 'pest_control' },
    flying: { classe: 'voador', nome: 'Voador', icone: 'air' },
    electric: { classe: 'eletrico', nome: 'Eletrico', icone: 'bolt' },
    normal: { classe: 'normal', nome: 'Normal', icone: 'radio_button_checked' },
    psychic: { classe: 'psiquico', nome: 'Psiquico', icone: 'neurology' },
    ground: { classe: 'terra', nome: 'Terra', icone: 'terrain' },
    rock: { classe: 'pedra', nome: 'Pedra', icone: 'landscape' },
    fairy: { classe: 'fada', nome: 'Fada', icone: 'auto_awesome' },
    fighting: { classe: 'lutador', nome: 'Lutador', icone: 'sports_mma' },
    ghost: { classe: 'fantasma', nome: 'Fantasma', icone: 'visibility_off' },
    ice: { classe: 'gelo', nome: 'Gelo', icone: 'ac_unit' },
    dragon: { classe: 'dragao', nome: 'Dragao', icone: 'pets' },
    dark: { classe: 'sombrio', nome: 'Sombrio', icone: 'dark_mode' },
    steel: { classe: 'aco', nome: 'Aco', icone: 'precision_manufacturing' }
}

const nomesStatus = {
    hp: 'HP',
    attack: 'Ataque',
    defense: 'Defesa',
    'special-attack': 'Ataque Esp.',
    'special-defense': 'Defesa Esp.',
    speed: 'Velocidade'
}

let pokemonsDaRegiao = []
let tokenModalAtual = 0
const cachePokemonPorNome = new Map()

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
        return { classe: '', nome: formatarNome(tipoApi), icone: 'help' }
    }

    return tipoConvertido
}

const montarTipos = (tiposPokemon) => tiposPokemon
    .map(({ type }) => {
        const tipo = obterClasseENomeTipo(type.name)
        const classeTipo = tipo.classe ? ` ${tipo.classe}` : ''
        return `<li class="tipo${classeTipo}"><span class="material-symbols-outlined tipo-icone" aria-hidden="true">${tipo.icone}</span><span>${tipo.nome}</span></li>`
    })
    .join('')

const calcularTamanhoSprite = (alturaDecimetros) => {
    const alturaNormalizada = Math.max(1, alturaDecimetros)
    const escala = Math.pow(alturaNormalizada / 10, 0.45)
    const tamanhoBase = 64 * escala

    return Math.max(46, Math.min(82, Math.round(tamanhoBase)))
}

const obterSprite = (pokemon) => pokemon.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default
    || pokemon.sprites.other?.showdown?.front_default
    || pokemon.sprites.other?.['official-artwork']?.front_default
    || pokemon.sprites.front_default

const obterSpriteShiny = (pokemon) => pokemon.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_shiny
    || pokemon.sprites.other?.showdown?.front_shiny
    || pokemon.sprites.front_shiny

const montarListaSprites = (sprites) => {
    if (!sprites.length) {
        return '<li class="modal-sprite-vazio">Nao ha sprites extras para este Pokemon.</li>'
    }

    return sprites
        .map((sprite) => {
            return `
                <li class="modal-sprite-item">
                    <img src="${sprite.url}" alt="${sprite.label}">
                    <span>${sprite.label}</span>
                </li>
            `
        })
        .join('')
}

const obterVariedadesMega = (pokemon) => {
    if (!pokemon.speciesData?.varieties?.length) {
        return []
    }

    return pokemon.speciesData.varieties
        .map((variedade) => variedade.pokemon.name)
        .filter((nome) => nome.includes('-mega'))
}

const obterPokemonPorNome = async (nomePokemon) => {
    if (cachePokemonPorNome.has(nomePokemon)) {
        return cachePokemonPorNome.get(nomePokemon)
    }

    const pokemonData = await fetchJson(`${URL_BASE}/${nomePokemon}`)
    cachePokemonPorNome.set(nomePokemon, pokemonData)
    return pokemonData
}

const carregarSpritesExtras = async (pokemon, token) => {
    const sprites = []
    const shinyBase = obterSpriteShiny(pokemon)

    if (shinyBase) {
        sprites.push({
            label: 'Shiny',
            url: shinyBase
        })
    }

    const nomesMega = obterVariedadesMega(pokemon)

    for (const nomeMega of nomesMega) {
        const megaData = await obterPokemonPorNome(nomeMega)
        const nomeMegaFormatado = formatarNome(nomeMega.replaceAll('-', ' '))
        const spriteMega = obterSprite(megaData)
        const spriteMegaShiny = obterSpriteShiny(megaData)

        if (spriteMega) {
            sprites.push({
                label: `${nomeMegaFormatado}`,
                url: spriteMega
            })
        }

        if (spriteMegaShiny) {
            sprites.push({
                label: `${nomeMegaFormatado} Shiny`,
                url: spriteMegaShiny
            })
        }
    }

    if (token !== tokenModalAtual) {
        return
    }

    modalPokemonSprites.innerHTML = montarListaSprites(sprites)
}

const obterNomeStatus = (nomeStatusApi) => nomesStatus[nomeStatusApi] || formatarNome(nomeStatusApi)

const montarStatus = (stats) => stats
    .map(({ base_stat: valor, stat }) => {
        const valorLimitado = Math.max(0, Math.min(200, valor))
        const percentual = (valorLimitado / 200) * 100

        return `
            <li class="modal-status-item">
                <span class="modal-status-nome">${obterNomeStatus(stat.name)}</span>
                <span class="modal-status-valor">${valor}</span>
                <span class="modal-status-barra"><span class="modal-status-preenchimento" style="width:${percentual}%"></span></span>
            </li>
        `
    })
    .join('')

const abrirModalPokemon = async (pokemon) => {
    tokenModalAtual += 1
    const token = tokenModalAtual

    modalPokemonNome.textContent = formatarNome(pokemon.name)
    modalPokemonNumero.textContent = formatarNumero(pokemon.id)
    modalPokemonSprite.src = obterSprite(pokemon)
    modalPokemonSprite.alt = `Sprite do Pokemon ${formatarNome(pokemon.name)}`
    modalPokemonStatus.innerHTML = montarStatus(pokemon.stats)
    modalPokemonSprites.innerHTML = '<li class="modal-sprite-vazio">Carregando sprites extras...</li>'
    modalPokemon.hidden = false
    body.style.overflow = 'hidden'

    try {
        await carregarSpritesExtras(pokemon, token)
    } catch (erro) {
        if (token !== tokenModalAtual) {
            return
        }

        modalPokemonSprites.innerHTML = '<li class="modal-sprite-vazio">Nao foi possivel carregar sprites extras.</li>'
        console.error('Erro ao carregar sprites extras do modal:', erro)
    }
}

const fecharModalPokemon = () => {
    tokenModalAtual += 1
    modalPokemon.hidden = true
    body.style.overflow = ''
}

const criarCartaoPokemon = (pokemon) => {
    const card = document.createElement('li')
    card.classList.add('cartao-pokemon')
    card.style.setProperty('--sprite-size', `${calcularTamanhoSprite(pokemon.height)}px`)
    card.dataset.pokemonId = String(pokemon.id)
    card.tabIndex = 0

    const sprite = obterSprite(pokemon)

    card.innerHTML = `
        <div class="informacoes">
            <span>${formatarNome(pokemon.name)}</span>
            <span>${formatarNumero(pokemon.id)}</span>
        </div>
        <div class="sprite-container">
            <img src="${sprite}" alt="${formatarNome(pokemon.name)}" class="gif">
        </div>
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
        console.log('JSON bruto da API /pokemon:', pokemons)

        const descricoes = await Promise.all(
            pokemons.map((pokemon) => fetchJson(pokemon.species.url))
        )

        pokemonsDaRegiao = pokemons.map((pokemon, indice) => {
            return {
                ...pokemon,
                descricao: obterDescricao(descricoes[indice]),
                speciesData: descricoes[indice]
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

listagemPokemon.addEventListener('click', (evento) => {
    const card = evento.target.closest('.cartao-pokemon')

    if (!card) {
        return
    }

    const pokemonId = Number(card.dataset.pokemonId)
    const pokemonSelecionado = pokemonsDaRegiao.find((pokemon) => pokemon.id === pokemonId)

    if (pokemonSelecionado) {
        abrirModalPokemon(pokemonSelecionado)
    }
})

listagemPokemon.addEventListener('keydown', (evento) => {
    if (evento.key !== 'Enter' && evento.key !== ' ') {
        return
    }

    const card = evento.target.closest('.cartao-pokemon')

    if (!card) {
        return
    }

    evento.preventDefault()

    const pokemonId = Number(card.dataset.pokemonId)
    const pokemonSelecionado = pokemonsDaRegiao.find((pokemon) => pokemon.id === pokemonId)

    if (pokemonSelecionado) {
        abrirModalPokemon(pokemonSelecionado)
    }
})

modalFechar.addEventListener('click', fecharModalPokemon)

modalPokemon.addEventListener('click', (evento) => {
    if (evento.target === modalPokemon) {
        fecharModalPokemon()
    }
})

document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && !modalPokemon.hidden) {
        fecharModalPokemon()
    }
})

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