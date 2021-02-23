/* jshint curly:true, debug:true */
/* globals $, Vue */

// Flickr API key
const API_KEY = '30c7bae1e08ea9c08ca855af85837c8d';

// 状態の定数
const IS_INITIALIZED = 'IS_INITIALIZED'; // 最初の状態
const IS_FETCH = 'IS_FETCH'; // APIからデータを取得中
const IS_FAILED = 'IS_FAILED'; // APIからデータを取得できなかった
const IS_FOUND = 'IS_FOUND'; // APIから画像データを取得できた

/**
 * TODO: 状態の定数を定義する
 * この定数は「検索テキストに該当する画像データがない状態」を表す
 * 定数名は、例えば IS_NOT_FOUND などが分かりやすい
 */
const IS_NOT_FOUND = 'IS_NOT_FOUND';

/**
 * --------------------
 * Flickr API 関連の関数
 * --------------------
 */

// 検索テキストに応じたデータを取得するためのURLを作成して返す
const getRequestURL = (searchText) => {
  const parameters = $.param({
    method: 'flickr.photos.search',
    api_key: API_KEY,
    text: searchText, // 検索テキスト
    sort: 'interestingness-desc', // 興味深さ順
    per_page: 12, // 取得件数
    license: '4', // Creative Commons Attributionのみ
    extras: 'owner_name,license', // 追加で取得する情報
    format: 'json', // レスポンスをJSON形式に
    nojsoncallback: 1, // レスポンスの先頭に関数呼び出しを含めない
  });
  const url = `https://api.flickr.com/services/rest/?${parameters}`;
  return url;
};


const getFlickrImageURL = (photo, size) => {
  let url = `https://farm${photo.farm}.staticflickr.com/${photo.server}/${photo.id}_${
    photo.secret
  }`;
  if (size) {

    url += `_${size}`;
  }
  url += '.jpg';
  return url;
};


const getFlickrPageURL = photo => `https://www.flickr.com/photos/${photo.owner}/${photo.id}`;


const getFlickrText = (photo) => {
  let text = `"${photo.title}" by ${photo.ownername}`;
  if (photo.license === '4') {

    text += ' / CC BY';
  }
  return text;
};



Vue.directive('tooltip', {
  bind(el, binding) {
    $(el).tooltip({
      title: binding.value,
      placement: 'bottom',
    });
  },
  unbind(el) {
    $(el).tooltip('dispose');
  },
});


new Vue({
  el: '#app',

  data: {
    prevSearchText: '',
    photos: [],
    currentState: IS_INITIALIZED,
  },

  computed: {
    isInitalized() {
      return this.currentState === IS_INITIALIZED;
    },
    isFetching() {
      return this.currentState === IS_FETCH;
    },
    isFailed() {
      return this.currentState === IS_FAILED;
    },
    isFound() {
      return this.currentState === IS_FOUND;
    },

    isNotFound() {
      return this.currentState === IS_NOT_FOUND;
    },
  },

  methods: {

    toFetching() {
      this.currentState = IS_FETCH;
    },
    toFailed() {
      this.currentState = IS_FAILED;
    },
    toFound() {
      this.currentState = IS_FOUND;
    },

    toNotFound() {
      this.currentState = IS_NOT_FOUND;
    },

    fetchImagesFromFlickr(event) {
      const searchText = event.target.elements.search.value;


      if (this.isFetching && searchText === this.prevSearchText) {
        return;
      }


      this.prevSearchText = searchText;

      this.toFetching();

      const url = getRequestURL(searchText);
      $.getJSON(url, (data) => {
        if (data.stat !== 'ok') {
          this.toFailed();
          return;
        }

        const fetchedPhotos = data.photos.photo;


        if (fetchedPhotos.length === 0) {

          this.toNotFound();
          
          return;
        }

        this.photos = fetchedPhotos.map(photo => ({
          id: photo.id,
          imageURL: getFlickrImageURL(photo, 'q'),
          pageURL: getFlickrPageURL(photo),
          text: getFlickrText(photo),
        }));
        this.toFound();
      }).fail(() => {
        this.toFailed();
      });
    },
  },
});
