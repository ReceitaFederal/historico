

import { asyncBufferFromUrl, parquetReadObjects } from './bibliotecas/hyparquet/hyparquet.min.js';

import { ComponenteBase } from './ComponenteBase.js';



export class Historico extends ComponenteBase {

    

    constructor(
        url, 
        colunas_agrupamento,          
        coluna_data_inicio, 
        coluna_data_fim,
        coluna_valor
    ){
        super();
        
        this.$dados = null;
        this.$url = url;
        this.$colunas_agrupamento = colunas_agrupamento;
        this.$coluna_data_inicio = coluna_data_inicio;
        this.$coluna_data_fim = coluna_data_fim;
        this.$coluna_valor = coluna_valor;

        this.$historicos_carregados = new Map();
    }

    get colunas_agrupamento(){
        return this.$colunas_agrupamento;
    }


    async carregar_historico(colunas, sazonalidade) {      
        
        const id_historico = `${colunas.join("-")}_${sazonalidade}`;

        //Se ainda não carregou 
        if (!this.$historicos_carregados.has(id_historico)){

            //Carrega parquet do servidor
            const url_historico = `${this.$url}/${id_historico}.parquet`
        
            const file = await asyncBufferFromUrl({ url: url_historico });
            const dados = await parquetReadObjects({ file });
        
            //Adicione ao cache
            this.$historicos_carregados.set(id_historico, dados);
        }

        //Devolve do cache
        return this.$historicos_carregados.get(id_historico);
    }  
}
