<template>
    <div class="Edited" style="top: 3em;">
        <div class="articles-edited-this-week">
            <h2>
                Articles Edited
                <span class="badge">{{ articlesCount }}</span>
            </h2>
            <!-- <p>
                <span>From: <b>{{ fromUtc }}</b></span> -
                <span>To <b>{{ toUtc }}</b></span>
            </p> -->

            <!-- Report Table -->
            <report-table
                :articles="articles"
                :isPublish="false"
                tableType="article-edited">
            </report-table>

            <paginate
                :page-count="pageCount"
                :click-handler="paginatePage"
                :prev-text="'Prev'"
                :next-text="'Next'"
                :container-class="'pagination'">

                <span slot="prevContent">&laquo;</span>
                <span slot="nextContent">&raquo;</span>
            </paginate>
        </div>
    </div>
</template>

<script>
    import ReportTable from './ReportTable.vue';
    import Paginate from 'vuejs-paginate'
    import { EditorPaginationMixin } from './../../mixins/EditorPaginationMixin.js';


    export default {
        props: ['tableType', 'index'],
        components: { ReportTable, Paginate },
        mixins: [ EditorPaginationMixin ],
        created() {
            this.editedArticles();
        },
        mounted() {
            this.listenWhenPowerEditorUpdated();
        },
        methods: {
            listenWhenPowerEditorUpdated(data) {
                ArticleBus.$on('editorUpdatedSpintaxCopy', data => {
                    Vue.set(this.articles, this.index, data);
                    // this.articles[this.index].spintax = data.spintax;  // tmp - just to update the spintax
                    // this.articles[this.index].spintax_copy = data.spintax_copy;
                    // this.articles[this.index].isEditorUpdateSC = data.isEditorUpdateSC;
                });
            },

            editedArticles(data) {
                axios.get('/editor/editedArticles'+this.pagePath)
                    .then(response => {
                        let payload = response.data;

                        this.articles = this.editor.mapResultOfArticles(payload.data);
                        this.pageCount = payload.last_page;
                        this.urlPath = payload.path;

                        ReportingBus.$emit('isLoadedListEditedArticles', this.articles);
                    });
            }
        }
    }
</script>