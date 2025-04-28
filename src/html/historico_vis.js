import { ComponenteBase } from './ComponenteBase.js';

export class HistoricoVis extends ComponenteBase {

    constructor(container, historico) {
        super();
        this.$container = container;
        this.$historico = historico;
        this.timeline = null;
        this.vis = null;
        this.groupsDataset = null;
        this.itemsDataset = null;
        this.$escalaRelativaAoGrupo = false;

        this.inicializarTimelineVazia().then(() =>
            this.preencherTimeline()
        );
    }

    async carregarDependencias() {
        await this.carregarScript('./bibliotecas/moment/moment.min.js', '_momentCarregado');
        await this.carregarCss('./bibliotecas/vis/timeline/vis-timeline-graph2d.min.css', 'vis-timeline');
        await this.carregarScript('./bibliotecas/vis/timeline/vis-timeline-graph2d.min.js', '_visTimelineCarregado');
        this.vis = window.vis;
    }

    async inicializarTimelineVazia() {
        await this.carregarDependencias();

        this.groupsDataset = new this.vis.DataSet();
        this.itemsDataset = new this.vis.DataSet();

        this.timeline = new this.vis.Timeline(this.$container, this.itemsDataset, this.groupsDataset, {
            start: moment().subtract(1, 'year').toDate(),
            end: moment().add(1, 'year').toDate(),
            horizontalScroll: true,
            zoomKey: 'ctrlKey',
            orientation: 'both',
            xss: { disabled: true },
            zoomMin: 1000 * 60 * 60 * 24 * 30,
            groupTemplate: (grupo_vis, elemento_vis) => {
                return `
                    <div style="display: flex; align-items: center;">
                        <span>${grupo_vis.coluna} --- <strong>${grupo_vis.valor}(${grupo_vis.id})</strong></span>
                        <span 
                            class="botao-expandir" 
                            data-grupo="${grupo_vis.id}"                            
                            style="margin-left: 8px; cursor: pointer; font-size: 16px; color: blue;">
                            ➕
                        </span>
                    </div>
                `;
            },
        });

        this.timeline.on('changed', () => {
            const botoes = this.$container.querySelectorAll('.botao-expandir');
            botoes.forEach(botao => {
                if (!botao.dataset.listenerRegistrado) {
                    botao.addEventListener('click', (evento) => {
                        evento.stopPropagation();
                        const grupoId = botao.getAttribute('data-grupo');
                        console.log('Clicou no ícone para expandir o grupo:', grupoId);
                        // Futuro: this.carregarDadosExtrasParaGrupo(grupoId);
                    });
                    botao.dataset.listenerRegistrado = 'true';
                }
            });
        });
    }

    async preencherTimeline() {
        if (!this.timeline) {
            console.error('Timeline não inicializada! Chame inicializarTimelineVazia() primeiro.');
            return;
        }

        const primeiraColuna = this.$historico.colunas_agrupamento[0];
        const dados = await this.$historico.carregar_historico([primeiraColuna], "mensal");

        const { grupos, items } = this.processarDados(dados, primeiraColuna);

        this.atualizarDatasets(grupos, items);
    }

    processarDados(dados, coluna) {
        const grupos = new Map();
        const items = [];
        const minMaxPorGrupo = new Map();
        let minGlobal = Infinity;
        let maxGlobal = -Infinity;

        dados.forEach((linha, idx) => {
            const id_grupo = `${coluna}-${linha[coluna]}`;
            const valor = Number(linha[this.$historico.$coluna_valor]) ?? 0;

            minGlobal = Math.min(minGlobal, valor);
            maxGlobal = Math.max(maxGlobal, valor);

            const minMax = minMaxPorGrupo.get(id_grupo) || { min: Infinity, max: -Infinity };
            minMax.min = Math.min(minMax.min, valor);
            minMax.max = Math.max(minMax.max, valor);
            minMaxPorGrupo.set(id_grupo, minMax);

            if (!grupos.has(id_grupo)) {
                grupos.set(id_grupo, {
                    id: id_grupo,
                    coluna,
                    valor: linha[coluna],
                    treeLevel: 1,
                    nestedGroups: [],
                });
            }

            if (linha[this.$historico.$coluna_data_inicio] && linha[this.$historico.$coluna_data_fim]) {
                items.push({
                    id: `item_${idx}`,
                    group: id_grupo,
                    valor,
                    content: `${valor}`,
                    start: linha[this.$historico.$coluna_data_inicio],
                    end: linha[this.$historico.$coluna_data_fim],
                    type: 'background'
                });
            }
        });

        this.colorirItems(items, minMaxPorGrupo, minGlobal, maxGlobal);

        return { grupos, items };
    }

    colorirItems(items, minMaxPorGrupo, minGlobal, maxGlobal) {
        items.forEach(item => {
            let min, max;
            if (this.$escalaRelativaAoGrupo) {
                const minMax = minMaxPorGrupo.get(item.group);
                min = minMax.min;
                max = minMax.max;
            } else {
                min = minGlobal;
                max = maxGlobal;
            }

            const intervalo = max - min || 1;
            const intensidade = (item.valor - min) / intervalo;
            const vermelho = Math.min(255, Math.floor(255 * intensidade));
            const cor = `rgb(${vermelho},0,0)`;

            item.style = `background-color: ${cor};`;
        });
    }

    atualizarDatasets(grupos, items) {
        this.groupsDataset.clear();
        this.itemsDataset.clear();
        this.groupsDataset.add(Array.from(grupos.values()));
        this.itemsDataset.add(items);
    }
}
