<template>
	<div class="ArticleEditor">
        <!-- Disapprove component -->
        <disapprove-article
            :article="article"
            v-if="showDisapprovePanel"
            @onSuccessSubmit="onSuccessSubmit"
            @isCancel="isCancelDisapprove">
        </disapprove-article>

		<h2 class="text-center">{{ article.doc_title }}</h2><hr>

        <form method="POST">
            <!-- <input type="hidden" name="_token" :value="token"> -->

            <!-- protected -->
            <div class="form-group">
                <label for="protected">Protected Terms</label>
                <textarea class="form-control" id="protected" rows="6" v-model="input.protected"></textarea>
            </div>

            <!-- citation -->
            <div class="form-group">
                <label for="citation">Citations</label>
                <textarea class="form-control" rows="12" v-model="article.citation"></textarea>
            </div>

            <!-- original article -->
            <div class="Original__article">
                <h3>Original Article</h3>
                <div id="orig-article-editor"></div>

                <!-- <button type="button" class="btn btn-success" @click.prevent="updateOriginalArticle">PROCESS</button> -->
                <button type="button" class="btn btn-success" ref="wordaiBtn" @click.prevent="runWordai">Spin Article</button>

                <!-- Misc -->
                &nbsp;&nbsp;&nbsp;
                <span v-if="isLoading">LOADING....</span>
                <span v-if="isError" style="color: #940a0a; font-size: .9em;">{{ error }}</span><br>
            </div>

            <!-- is spintax & spin is process -->
            <!-- <div id="info" class="alert" :class="isSpintaxAndSpinUpdated">
                <p class="h4" v-if="article.isProcess === 0">Spintax and Process Article is not updated yet. Wait for a few minutes and reload the page.</p>
                <p class="h4" v-else>Spintax and Process Article is now up to date.</p>
            </div> -->

            <!-- spintax result -->
            <div class="Spintax__result" v-if="peditoraccess">
                <h3>Spintax Result</h3><br>

                <div class="find row">
                    <div class="col-md-4">
                        <div class="form-group">
                            <label for="company">Company</label>
                            <input type="text" class="form-control" id="company" name="company" v-model="input.company">
                        </div>
                    </div>

                    <div class="col-md-4">
                        <div class="form-group">
                            <label for="city">City</label>
                            <input type="text" class="form-control" id="city" name="city" v-model="input.city">
                        </div>
                    </div>

                    <div class="col-md-4">
                        <div class="form-group">
                            <label for="state">State</label>
                            <input type="text" class="form-control" id="state" name="state" v-model="input.state">
                        </div>
                    </div>
                </div>

                <div class="Peditor" v-if="! pEditorAccess">
                    <p v-if="article.isEditorUpdateSC === 0">{{ article.spintax }}</p>
                    <p v-else>{{ article.spintax_copy }}</p>
                    <br>

                    <button type="button" class="btn btn-default power-editor" @click="onPowerEditor" ref="pEditorBtn">Power Editor</button>
                </div>

                <!-- Power Editor -->
                <power-editor
                    :article="article"
                    :inputs="input"
                    :tableType="tableType"
                    v-if="pEditorAccess"
                    @isPowerEditorDismiss="dismissPowerEditor">
                </power-editor>
            </div>

            <!-- spin result -->
            <div class="Process__article">
                <h3>Processed Article</h3><br>
                <div class="Editor">
                    <div id="editor"></div>
                    <button type="button" class="btn btn-success right-side" @click="updateArticle" ref="saveChangeBtn">Save Article Changes</button>
                </div>

                <!-- textgear -->
                <textgear-result
                    :grammar="textgear"
                    v-if="isGrammarTrue"
                    @isClose="closeTextGear">
                </textgear-result>

                <!-- copyscape -->
                <copyscape-result
                    :copy="copyscape"
                    :duplicates="duplicates"
                    @updateduplicates="updateDuplicates"
                    v-if="responseSuccess">
                </copyscape-result>

                <div class="Actions">
                    <!-- Copyscape -->
                    <div class="first-button">
                        <div class="action" v-if="! csBusinessRuleShow">
                            <button type="button" class="btn btn-warning" @click="processToCopyscape" ref="csButton">Copyscape</button>
                        </div>
                        <div class="business-rule" v-else>
                            <button class="btn btn-business-rule" disabled>Copyscape check hits business rule</button>
                        </div>
                    </div>

                    <!-- Respin -->
                    <div class="first-button">
                        <div class="action" v-if="! respinBusinessRuleShow">
                            <button type="button" class="btn btn-info" @click="respinArticle" ref="respinBtn">Respin Article</button>
                        </div>
                        <div class="business-rule" v-else>
                            <button class="btn btn-business-rule" disabled>Respin hits business rule</button>
                        </div>
                    </div>

                    <!-- Textgear -->
                    <button type="button" class="btn btn-info textgear" @click="processToTextGear" ref="tgButton">Check Grammar</button>

                    <!-- Reset Article -->
                    <button type="button" class="btn btn-danger" @click="resetSpinArticle" ref="resetChangeBtn">Reset Article</button>


                    <!-- Counter -->
                    &nbsp;
                    <span class="counter">Copyscape <b class="label label-warning">{{ csCounter }}</b></span>
                    <span class="counter">Respin <b class="label label-info">{{ respinCounter }}</b></span>

                    <div class="seperator"></div>

                    <!-- Approve Article -->
                    <button type="button" class="btn btn-primary approve" @click="approveArticle" ref="approveBtn">Approve Article</button>

                    <!-- Disapprove Article -->
                    <button type="button" class="btn btn-primary disapprove" @click="rejectArticle" ref="disapproveBtn">Reject Article</button>

                    <!-- Dismiss -->
                    <button type="button" class="btn btn-danger" id="close" @click="dissmissArticle">Back to Articles</button>

                    <!-- Misc -->
                    &nbsp;&nbsp;&nbsp;
                    <span v-if="isLoading">LOADING....</span>
                    <span v-if="isError" style="color: red;">{{ error }}</span><br>

                    <!-- Stopwatch -->
                    <div class="timer-overlay">
                        <span>Time Spent</span>
                        <div class="stopwatch"></div>
                    </div>
                </div>
            </div>
        </form>
	</div>
</template>

<script>
	import PowerEditor from './PowerEditor.vue';
	import CopyscapeResult from './../words/CopyscapeResult.vue';
	import { CrudMixin } from './../../mixins/CrudMixin.js';
	import { ArticleMixin } from './../../mixins/ArticleMixin.js';
    import Stopwatch from './../../class/Stopwatch.js';
    import TextgearResult from './../words/TextgearResult.vue';
    import DisapproveArticle from './../admin/DisapproveArticle.vue';

	export default {
		props: ['article', 'tableType', 'peditoraccess'],
		components: { PowerEditor, CopyscapeResult, TextgearResult, DisapproveArticle },
		mixins: [ CrudMixin, ArticleMixin ],
		data() {
			return {
				type: 'edit-article',
				spin: {},
				pEditorAccess: false,
				csCounter: 0,
                respinCounter: 0,
				csBusinessRuleShow: false,
				respinBusinessRuleShow: false,
                charHighlighted: '',
                clock: {},
                times: [0, 0, 0],
                showDisapprovePanel: false,
                input: {
                    protected: this.article.protected,
                    citation: this.article.citation,
                    company: '',
                    city: '',
                    state: ''
                },
                newArticle: {}
			}
		},
        computed: {
            isSpintaxAndSpinUpdated() {
                return {
                    'alert-danger': this.article.isProcess === 0,
                    'alert-success': this.article.isProcess === 1
                };
            }
        },
		watch: {
			spin(data) {
                this.csBusinessRuleShow = data.isCsCheckHitMax === 1 ? true : false;
				this.respinBusinessRuleShow = data.isRespinHitMax === 1 ? true : false;
			},

            pEditorAccess() {
                Vue.nextTick(() => this.updateFirstSummernote($('div.Peditor'), this.article));
            }
		},
		mounted() {
            // vars
            this.newArticle = this.article;
            this.csCounter = this.article.csCounter;
            this.respinCounter = this.article.respinCounter;

			this.spin = this.article;
            this.initSummernote();
            this.initStopwatch();
		},
		methods: {
            updateFirstSummernote(div, article) {
                let p = div.find('p');

                // check if ther is paragraph && there is spintax_copy and not = to null
                if (p.length > 0 && article.isEditorUpdateSC === 1) {
                    Vue.nextTick(() => {
                        p.text(article.spintax_copy);
                        this.changeCurlyColor();
                    });
                } else {
                    Vue.nextTick(() => {
                        p.text(article.spintax);
                        this.changeCurlyColor();
                    });
                }
            },

            updateSecondSummernote(div, article) {
                // let p = div.find('p');
                let p = div;

                // check if there is paragraph
                // if (p.length > 0) Vue.nextTick(() => p.text(article.spin));
                Vue.nextTick(() => p.html(article.spin).css('white-space', 'pre-wrap'));
            },

            changeCurlyColor() {
                let spintax = $('div.Peditor').find('p').html();
                let result = spintax.replace(/[{}|]/g, function(char, offset, string) {
                    let span = '';

                    if (char.match(/[{}]/)) {
                        span = '<span class="curly">' + char + '</span>'
                    } else {
                        span = '<span class="pipe">' + char + '</span>'
                    }

                    return span;
                });

                $('div.Peditor').find('p').html(result); // format as html
            },

            removeFormatWhenPasting(e) {
                let bufferText = ((e.originalEvent || e).clipboardData || window.clipboardData).getData('Text');
                e.preventDefault();
                document.execCommand('insertText', false, bufferText);
            },

            initSummernote() {
                let vm = this;
                let article = vm.article;
                let div = $('div#editor');
                let origArticle = $('div#orig-article-editor');

                // Original Article summernote
                Vue.nextTick(() => origArticle.summernote('editor.insertText', article.article));

                // Setup summernote
                div.summernote({
                    callbacks: {
                        onInit() {
                            // 1st summernote - format paragraph
                            vm.updateFirstSummernote($('div.Peditor'), article);

                            // change curly color
                            Vue.nextTick(() => vm.changeCurlyColor());

                            // 2nd summernote - insert text
                            vm.updateSecondSummernote($('div.note-editable'), article);
                        },

                        onPaste(e) {
                            vm.removeFormatWhenPasting(e);
                        }
                    }
                });
            },

            initStopwatch() {
                let article = this.article;

                this.times = [
                    article.hr_spent_editor_edit_article,
                    article.min_spent_editor_edit_article,
                    article.sec_spent_editor_edit_article
                ];

                this.clock = new Stopwatch(
                    this.times,
                    document.querySelector('.stopwatch'),
                    document.querySelector('.results')
                );
                this.clock.start();
            },

			setupToUpdateArticle(article, clickType) {
                this.newArticle['article'] = article;
                this.newArticle['times'] = this.times;
                this.newArticle['input'] = this.input;
                this.newArticle['clickType'] = clickType;

                this.$refs.saveChangeBtn.disabled = true;

				axios.patch('/editor/updateArticle', this.newArticle).then(response => {
					let data = response.data;

                    this.$refs.saveChangeBtn.disabled = false;

					if (data.isSuccess) {
                        this.newArticle['isProcess'] = 0; // info change to alert-danger

                        // successfully updated
                        let articleTitle = this.article.doc_title;
                        new Noty({
                            type: 'info',
                            text: `<b>${articleTitle}</b> article successfully updated.`,
                            layout: 'bottomLeft',
                            timeout: 5000
                        }).show();

                        data.result['isProcess'] = 0;
						this.$emit('isUpdated', data.result);
					}
				});
			},

            updateArticle() {
                let article = $('div.Process__article').find('div.note-editable').html();
                this.setupToUpdateArticle(article, 'process-article');
            },

            updateOriginalArticle() {
                let article = $('div.Original__article').find('div.note-editable').text();
                this.setupToUpdateArticle(article, 'original-article');
            },

			dissmissArticle() {
                this.editorSpentTimeOnEditingArticle();
			},

			onPowerEditor() {
				this.pEditorAccess = true;
			},

			dissmissSpintaxArticle() {
				this.pEditorAccess = false;
			},

			respinArticle() {
				this.isLoading = true;
				this.isError = false;
				this.$refs.respinBtn.disabled = true;

				// vars
				// this.spin['article'] = $('div.note-editable').html();
				this.spin['type'] = 'edit-article';

                // check if type is 'edit-article'
                if (this.type === 'edit-article') {
                    this.respinCounter--;   // increment respinCounter
                }

				let editor = $('div.note-editable');
				editor.slideUp(); // hide editor

                // params
                const params = {
                    word_id: this.article.id,
                    article: this.article.isEditorUpdateSC === 1 ? this.article.spintax_copy : this.article.spintax,
                    respinCounter: this.respinCounter
                };

                axios.post('/words/respinArticle', params).then(response => {
                    let data = response.data;
                    editor.slideDown(); // show editor
                    editor.html(data);

                    this.isLoading = false;
                    this.$refs.respinBtn.disabled = false;

                    // update article obj in vue data
                    /*ArticleBus.$emit('isRespinArticle', {
                        article: data,
                        times: []
                    });*/

                    // check if api response is fail
                    /*if (data.status === 'Failure') {
                        this.error = data.error;
                        this.isError = true;
                    }*/

                    // check if counter = 5
                    if (this.type == 'edit-article' && this.respinCounter == 0) {
                        this.updateRespinCheckHitMax();
                    }
                });
			},

			updateCsCheckHitMax() {
				const data = { word_id: this.article.id };

				axios.patch('/words/updateCsCheckHitMax', data).then(response => {
					if (response.data) {
						this.csBusinessRuleShow = true;
					}
				});
			},

            updateRespinCheckHitMax() {
                const data = { word_id: this.article.id };

                axios.patch('/words/updateRespinCheckHitMax', data).then(response => {
                    if (response.data) {
                        this.respinBusinessRuleShow = true;
                    }
                });
            },

            editorSpentTimeOnEditingArticle(emitType) {
                const data = {
                    word_id: this.article.id,
                    times: this.times
                };

                axios.patch('/editor/editorSpentTimeOnEditingArticle', data).then(response => {
                    let data = response.data;

                    if (data) {
                        this.$emit('isDismiss', {
                            // article: $('div.note-editable').html(),
                            article: $('div.Process__article').find('div.note-editable').html(),
                            times: data
                        });
                    }
                });
            },

            dismissPowerEditor(data) {
                this.pEditorAccess = false;
                this.newArticle = data;
            },

            closeTextGear() {
                this.isGrammarTrue = false;
            },

            resetSpinArticle() {
                let editor  = $('div.Process__article').find('div.note-editable');

                editor.text('');
                Vue.nextTick(() => editor.html(this.article.spin));
            },

            approveArticle() {
                let title = this.article.doc_title;

                axios.post('/admin/approveArticle', this.article).then(response => {
                    // remove item after article has approved
                    // response.data && this.articles.splice(index, 1);

                    // notify user
                    new Noty({
                        type: 'info',
                        text: `<b>${title}</b> article successfully approved.`,
                        layout: 'bottomLeft',
                        timeout: 5000
                    }).show();
                });
            },

            rejectArticle() {
                if (this.article.isProcess > 0) {
                    this.showDisapprovePanel = true;
                } else {
                    // notify user
                    new Noty({
                        type: 'info',
                        text: `This article is not process yet with wordai. Come back later.`,
                        layout: 'bottomLeft',
                        timeout: 5000
                    }).show();
                }
            },

            onSuccessSubmit() {
                this.showDisapprovePanel = false;
            },

            isCancelDisapprove() {
                this.showDisapprovePanel = false;
            },

            cleanTerms(terms) {
                if (terms !== null && terms.length > 0) {
                    // find all line breaks and replace with comma(,)
                    let result = terms.replace(/[\n]/g, ',');

                    // results
                    result = result.match(/[^\,]+/g);

                    // trim space on each results
                    result = result.map(item => item !== null ? item.trim() : '');

                    return result.join(',');
                } else {
                    return '';
                }
            },

            runWordai() {
                this.isLoading = true;
                this.isError = false;
                this.$refs.wordaiBtn.disabled = true;

                // modify newArticle data
                this.newArticle['article'] = $('div.Original__article').find('.note-editable').text();

                // update pt and dpt, add space as what api require
                this.newArticle['protected'] = this.cleanTerms($('textarea#protected').val());
                this.newArticle['domain_protected'] = this.cleanTerms(this.article.domain_protected);

                axios.post('/words/runWordai', this.newArticle).then(response => {
                    let data = response.data;

                    this.isLoading = false;
                    this.isDomainNotSet = false;
                    this.$refs.wordaiBtn.disabled = false;

                    if (data.spintaxStatus) {
                        this.isError = false;

                        // notify user article posted successfully
                        let articleTitle = this.spin.doc_title;
                        new Noty({
                            type: 'info',
                            text: `<b>${articleTitle}</b> article successfully updated.`,
                            layout: 'bottomLeft',
                            timeout: 5000
                        }).show();

                        // reload the page
                        window.setTimeout(() => window.location.href = '/editor', 3000);


                        // this.$emit('afterWordai', data.result);

                    } else { // check if spintax is error
                        this.isError = true;
                        this.error = data.result.error;
                    }
                });
            }
		}
	}
</script>

<style scoped>
    #info p { text-align: center; }

	.ArticleEditor { margin-bottom: 3em; }
	h3 { text-align: center; }
	p { white-space: pre-wrap; }

	.Editor { position: relative; }
	button.right-side {
		position: absolute;
		right: 0;
	}

	button.power-editor {
		background: #D13DD1;
		color: #fff;
		border: #8c3f8c;
	}
	button.power-editor:hover { background: #BC2EBC; }
	.Copyscape, .errorlist { margin-top: 5em; }

    button.textgear { background-color: #af863f !important; }
    button.textgear:hover {
        background-color: #9D7734 !important;
        border: 1px solid #936B25 !important;
    }

    button.approve {
        background: #62bb75;
        border: 1px solid #55b369;
    }
    button.approve:hover { background: #5CB06E; }

    button.disapprove {
        background: #f14b69;
        border: 1px solid #e23e5c;
    }
    button.disapprove:hover { background: #E5425F; }

    .seperator { margin-bottom: 0.5em; }

	div.first-button {
	    float: left;
	    margin-right: 0.2em;
	}



	/*=============== Gradient button ===============*/
	.btn-business-rule {
		background-color: hsl(0, 0%, 13%) !important;
		background-repeat: repeat-x;
		filter: progid:DXImageTransform.Microsoft.gradient(startColorstr="#bababa", endColorstr="#212121");
		background-image: -khtml-gradient(linear, left top, left bottom, from(#bababa), to(#212121));
		background-image: -moz-linear-gradient(top, #bababa, #212121);
		background-image: -ms-linear-gradient(top, #bababa, #212121);
		background-image: -webkit-gradient(linear, left top, left bottom, color-stop(0%, #bababa), color-stop(100%, #212121));
		background-image: -webkit-linear-gradient(top, #bababa, #212121);
		background-image: -o-linear-gradient(top, #bababa, #212121);
		background-image: linear-gradient(#bababa, #212121);
		border: 1px solid #7d7d7d;
		color: #fff !important;
		text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.99);
		-webkit-font-smoothing: antialiased;
	}
</style>