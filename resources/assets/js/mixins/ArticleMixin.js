export const ArticleMixin = {
	data() {
		return {
			copyscape: {},
			responseSuccess: false,
			error: '',
			isError: false,
			duplicates: [],
			smArticle: '', // sm - summernote,
			textgear: {},
			isGrammarTrue: false,
			articleDuplicates: [],
			isDisableSpinAndCs: true,
            isCsHasResult: false
		}
	},
	watch: {
		articleDuplicates(data) {
			this.isDisableSpinAndCs = (
                data !== null &&
                data.length > 0 &&
                this.isCsHasResult === true
            ) ? false : true;
		}
	},
	methods: {
		generateRespintax(index=0) {
			this.isLoading = true;
			this.isError = false;

			this.spin['paragraph'] = this.paragraph;
			axios.post('/words/generateRespintax', this.spin).then(response => {
				let data = response.data;
				let text = data.text;

				if (data.status === 'Success') {
					this.isLoading = false;
					this.newParagraph = text;

					this.$emit('updateparagraph', {
						index: this.index,
						paragraph: text
					});
				}

				// check if api response is fail
				if (data.status === 'Failure') {
					this.error = data.error;
					this.isError = true;
				}
			});
		},

		splitResultBySentence(csResult) {
			let duplicates = [];

			/*for (let i=0; i<results.length; i++) {
				// duplicates.push(results[i].textsnippet.split(/(\s?)\.\.\.(\s?)/gi));
				duplicates.push(results[i].textsnippet.match(/[^\.!\?]+/gi));
			}*/

            duplicates = csResult.alltextmatched.match(/[^\.!\?]+/gi);

			return duplicates;
		},

		removeEmptyValueFromSentence(duplicates) {
			let finds = [];

            // orig
			/*for (let i=0; i<duplicates.length; i++) {
				let firstArr = duplicates[i]; 	// index
				let secondArr = []; 			//value

				for (let j=0; j<firstArr.length; j++) {
					secondArr = this.escapeRegExp(firstArr[j]).trim();
                    secondArr = this.escapeRegExpWithData(secondArr, '');

					// if second array value is not empty
					if (secondArr.length > 3 && /[^\d]/.test(secondArr) && $.inArray(secondArr, finds) === -1) {
						finds.push(secondArr);
					}
				}
			}*/

            // new
            for (let i=0; i<duplicates.length; i++)  {
                let value = duplicates[i] !== null ? duplicates[i].trim() : '';

                // if second array value is not empty
                // if (value.length > 3 && /[^\d]/.test(value) && $.inArray(value, finds) === -1) {
                if ($.inArray(value, finds) === -1) {
                    finds.push(value);
                }
            }

			return finds;
		},

		escapeRegExp(str) {
			return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
		},

        escapeRegExpWithData(str, replace) {
            return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, replace);
        },

		setMarkTag(article, find) {
            // return article.replace(RegExp(find, 'gi'), '<mark>' + find + '</mark>');
			return article.replace(find, '<mark>' + find + '</mark>');
		},

		replaceSearchSenteceByMarkTag(article, finds) {
			// let article = $('div.note-editable').text();

			for (let i=0; i<finds.length; i++) {
                // find = this.escapeRegExp(finds[i]);
                find = finds[i];
				// find = this.escapeRegExpWithData(find, '');
				article = this.setMarkTag(article, find);
			}

			return article;
		},

		prependMarkTagToSearchSendtenceAndHighlight(article, finds) {
			let find = '';
			// let article = '';

			// replace search sentence by mark tag
			article = this.replaceSearchSenteceByMarkTag(article, finds);

			// highlight summernote paragraph
			this.smArticle = article;
			$('div.Process__article').find('div.note-editable').html(this.smArticle);
		},

		colorDuplicatesInRed(duplicates) {
			let paragraphs = $('div.Copyscape__result').find('p');
			let paragraph = '';
			let vm = this;

			$.each(paragraphs, function(index, value) {
				paragraph = value.innerText.trim();

				for (let i=0; i<duplicates.length; i++) {
					paragraph = vm.setMarkTag(paragraph, vm.escapeRegExp(duplicates[i]));
				}

				// modify result of the copyscape[index].result.textsnippet
				vm.copyscape.result[index].textsnippet = paragraph;

				// when search color red the duplicate
				paragraphs.html(paragraph);
			});
		},

        findDuplicateMatchOnArticle(finds, article) {
            let results = [];

            for (var i = 0; i < finds.length; i++) {
                let find = finds[i].toLowerCase();
                article = article.toLowerCase();

                //  find match on article
                let result = article.indexOf(find);

                if (result > 0) results.push(find);
            }

            return results;
        },

		copyScapeData(data) {
			let results = data;
			let duplicates = [];
			let finds = [];

			// split to sentence
			duplicates = this.splitResultBySentence(results);

            // console.log(duplicates)

			// remove empty value from duplicates
			finds = this.removeEmptyValueFromSentence(duplicates);

            // console.log(finds)

            // find all match on article base on result of finds var
            let article = $('div.Process__article').find('div.note-editable').text();
            // finds = this.findDuplicateMatchOnArticle(finds, article);

			// prepend mark tag to search string and highlight
			this.prependMarkTagToSearchSendtenceAndHighlight(article, finds);

			// replace duplicates and color by red
			// Vue.nextTick(() => this.colorDuplicatesInRed(finds));

			// store as result in vue data
            this.duplicates = finds;
		},

		copyScapeSetup(url, data) {
			this.isLoading = true;
			this.isError = false;
            this.responseSuccess = false;
			this.$refs.csButton.disabled = true;

			// check if type is 'edit-article'
			if (this.type === 'edit-article') {
				this.csCounter--; 	// track cs checks counter
			}

            // add csCounter new value
            this.article['csCounter'] = this.csCounter;

			axios.post(url, data).then(response => {
				let data = response.data;

				// api result response success
				this.isLoading = false;
				this.copyscape = data;
				this.responseSuccess = true;
				this.$refs.csButton.disabled = false;

				// find all duplicate occurences
				// this.copyScapeData(data.result);

				// check if api response is fail
				if (data.error) {
					this.error = data.error;
					this.isError = true;
					this.responseSuccess = false;
				} else {
					// find all duplicate occurences
                    if (data.hasOwnProperty('result')) {
                        this.isCsHasResult = true;
                        // Vue.nextTick(() => this.copyScapeData(data.result));
                        Vue.nextTick(() => this.copyScapeData(data));
                    } else {
                        this.isCsHasResult = false;
                    }

                    // emit action to remove article record that is edited
                    ArticleBus.$emit('editorUpdatedSpintaxCopy');
				}

				// check if counter = 5
				if (this.type == 'edit-article' && this.csCounter == 0) {
					this.updateCsCheckHitMax();
				}
			});
		},

		processToCopyscape() {
            this.duplicates = []; //  reset duplicates value
			this.spin['type'] = this.type;
			let url = '/words/processToCopyscape';

			// if type is 'article' then it is entire article
			// else separate paragprah
			switch(this.type) {
				case 'article':
					this.spin['article'] = (! this.responseSuccess) ? this.article : $('div.note-editable').text();
					this.copyScapeSetup(url, this.spin);
					break;
				case 'paragraph':
					this.spin['paragraph'] = this.paragraph;
					this.copyScapeSetup(url, this.spin);
					break;
				case 'edit-article':
					this.spin['article'] = $('div.Process__article').find('div.note-editable').text();
					this.copyScapeSetup(url, this.spin);
					break;
			}
		},

		replaceAt(offset, substr, replace) {
			let data = this.textgear.errors;

			for (var i = 0; i < data.length; i++) {
				// find index/offset
				let off = data[i].offset;


				console.log(off);

				// remove substr
				// replace with '='
			}
		},

		processToTextGear() {
			this.isLoading = true;
			this.isError = false;
			this.$refs.tgButton.disabled = true;

			const payload = { text: $('div.note-editable').html() };

			axios.post('/words/processTextGrammar', payload).then(response => {
				let data = response.data;

				if (data.result) { // api result response success
					this.isLoading = false;
					this.textgear = data;
					this.isGrammarTrue = true;
					this.$refs.tgButton.disabled = false;

					// add span tag on a bad words result in check grammar
					let article = payload.text;
					let result = '';
					let off = 0;

					for (let i = 0; i < data.errors.length; i++) {
						/*// find index/offset
						off = data.errors[i].offset;

						// get substr
						let sub = data.errors[i].bad;

						// remove substr


						// replace with '='*/


						let val = data.errors[i];
						let word = val.bad.trim();
						let len = val.length;
						off = val.offset;

						// if (i === 1) break;

						result += article.replace(word, (match, p1, offset, string) => {
							return `<span>${match}</span>`;
						});

						// console.log(result);

						// let left = len + word.length;
						// result = `${article.substr(off, len)} <span>${word}</span> ${article.substr(left)}`;
						// // off +=
						// console.log(result);

					}

					// new article base on check grammar result
					// $('div.note-editable').text('').html(result);
					// console.log(result);

				} else { // check if api response is fail
					this.error = data.error;
					this.isError = true;
					this.isGrammarTrue = false;
				}
			});
		},

		updateDuplicates(duplicates) {
			this.articleDuplicates = duplicates;
            // Vue.set(this.articleDuplicates, [], duplicates);
		},

		generateNewArticle(article) {
			axios.post('/words/generateFullArticle', { article: article }).then(response => {
				// this.article = response.data;
				// this.isSuccess = true;

				console.log(response.data);
			});
		},

		spinDuplicatesAndCopyscape() {
			this.isLoading = true;
			this.$refs.spinAndCsButton.disabled = true;

			// join the duplicates e.g ['a===b===c']
			let joinDuplicates = this.articleDuplicates.join('===');

			// data for spin
			this.spin['article'] = joinDuplicates;
			this.spin['type'] = 'article-duplicates';

			// run spintax and spin
			axios.post('/words', this.spin)
				.then(response => {
					let data = response.data;

					this.isLoading = false;
					this.$refs.spinAndCsButton.disabled = false;

					// check if api response is success
					if (data.status === 'Success') {
						let text = data.text;

						// this.spintaxResult = text;
						// console.log(text);

						// article is now the spintax result
						// display finish full article
						this.generateNewArticle(this.spin.article);
					}

					// check if api response is fail
					if (data.status === 'Failure') {
						this.error = data.error;
					}
				});

			// make new array of duplicates base on join results
			// results of article duplicates
			// search for the duplicates in the article
			// if find then replace with the new array of join results
			// run copyscape
		}
	}
};