// 設定遊戲狀態
const GAME_STATE = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardMatchFailed: "CardMatchFailed",
  CardMatched: "CardMatched",
  GameFinished: "GameFinished",
}

// 首先處理花色的圖檔
// 註：此處 Symbols 常數儲存的資料不會變動，因此習慣上將首字母大寫以表示此特性
const Symbols = [
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png', // 黑桃
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png', // 愛心
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png', // 方塊
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png' // 梅花
]

const view = {
  // 注意這裡的語法，當物件的屬性與函式/變數名稱相同時，可以省略不寫
  getCardContent(index) {
    // 卡牌數字是 index 除以 13後的「餘數 +1」，運算時記得加上 Math.floor，因為我們只需要整數
    const number = this.transformNumber((index % 13) + 1)
    const symbol = Symbols[Math.floor(index / 13)]
    return `<p>${number}</p>
      <img src="${symbol}" />
      <p>${number}</p>`
  },
  
  getCardElement(index) {
    // 綁 dataset 可以知道每一張牌的數字
    return `<div data-index="${index}" class="card back"></div>`
  },

  displayCards(indexes) {
    const rootElement = document.querySelector('#cards')
    // array.from 製造陣列 Array()製造陣列長度(空值) .keys 迭代器
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join('')
  },

  // 考慮到撲克牌中 11、12、13 與 數字 1 在卡牌上的呈現應為 J、Q、K 與 A，讓我們再新增一個 transformNumber 函式來處理數字轉換的問題吧
  // 由於狀況有 4 種，在這裡用 switch 會比 if/else 清楚
  transformNumber(number) {
    switch(number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },

  // 顯示卡片 正面、背面
  // ... 為 展開運算子 (形成陣列)
  flipCards(...cards) {
    // card 代表每個點擊的卡片元素
    //如果是背面
    //回傳正面
    // 使用 map 跌代
    cards.map(card => {
      if (card.classList.contains('back')) {
        // 移除背面 class
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(Number(card.dataset.index))
        // dataset 拿隨機數字
        return
      }
      //如果是正面
      //回傳背面
      card.classList.add('back')
      card.innerHTML = null     
    })
    
  },
  // 更改配對成功的卡片顏色
  pairCards(...cards) {
    cards.map(card => {
      card.classList.add('paired')
    })    
  },
  // 改變分數、嘗試次數函式
  renderScore(score) {
    document.querySelector('.score').textContent = `Score: ${score}`;
  },

  renderTriedTimes(times) {
    document.querySelector(".tried").textContent = `You've tried: ${times} times`;
  },

  appendWrongAnimation(...cards) {
  cards.map(card => {
    card.classList.add('wrong')
    // 移除動畫 class，否則它會一直存在
    // once: true 是為了只執行一次就拿掉，否則一張卡片會掛上很多次監聽器，從而影響效能
    card.addEventListener('animationend', event => event.target.classList.remove('wrong'), { once: true })
    })
  },

  showGameFinished() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
      `
    // 放在 header 之前
    const header = document.querySelector('#header')
    header.before(div)
  }
}
// 洗牌演算法，類似一個小小的外掛工具，對一個歸類控來說，這種小工具歸類到 Model / View / Controller 都不太舒服，讓我們宣告另一個叫 utility 的模組來存放這個小工具，這個 utility 概念像是外掛函式庫
const utility = {
  // 創造隨機亂數陣列函式
  getRandomNumberArray(count) {
    // count = 5 => [2, 3, 4, 1, 0] 希望效果為隨機出數字
    // number = 創造 array
    const number = Array.from(Array(count).keys())
    // 迴圈從最後一張牌開始跑，做到第 2 張牌為止
    for(let index = number.length - 1; index > 0; index--) {
      // 隨機取 52 之中的 1 個數字
      let randomIndex = Math.floor(Math.random() * (index + 1))

      // 不使用解構賦值，交換元素位置的範例
      // arr = [1, 2, 3, 4, 5]
      // const temp = 1
      // arr[4] = temp， arr[0] = 5

      // 解構賦值寫法，更加有語義表現的形式
      ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    return number
    // 最後把洗亂的陣列放入 rootElement.innerHTML
  }
}

// 建立MVC架構
// 由 controller 統一發派任務給 view 和 model
const controller = {
  // 初始狀態 (還沒翻牌)
  currentState: GAME_STATE.FirstCardAwaits,
  // 之後都由 controller 來控制遊戲狀態
  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52))
  },
  
  // 依照不同的遊戲狀態，做不同的行為
  dispatchCardAction(card) {
    // 錯誤檢查
    if(!card.classList.contains('back')) {
      return
    }
    // 由於有多個遊戲狀態，所以這裡我們用 switch 取代 if/else，讓程式碼看起來簡潔一點
    switch(this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        // 改變遊戲狀態、翻牌、儲存翻到的排到陣列裡
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break
      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes(++model.triedTimes) // 新增嘗試次數
        view.flipCards(card)
        model.revealedCards.push(card)
        // 翻了第二張牌，開始判斷是否配對成功
        if(model.isRevealedCardMatched()) {
          // 配對成功
          view.renderScore(model.score += 10) // 新增成功分數
          this.currentState = GAME_STATE.CardMatched
          // 呼叫函式改卡片顏色
          view.pairCards(...model.revealedCards)
          model.revealedCards = []
          if(model.score === 260) {
            this.currentState = GAME_STATE.GameFinished
            // 渲染遊戲結束畫面
            view.showGameFinished()
            return
          }
          this.currentState = GAME_STATE.FirstCardAwaits
        } else {
          // 配對失敗
          this.currentState = GAME_STATE.CardMatchFailed
          // 增加配對失敗動畫
          view.appendWrongAnimation(...model.revealedCards)
          setTimeout(this.resetCards, 1000)
        }
        break
    }
    console.log('this.currentState', this.currentState)
    console.log('revealedCards', model.revealedCards.map(card => card.dataset.index))
  },
  // 設定放置 seTimeout 函式
  resetCards() {
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    // 記得這裡需要改成從 controller 呼叫物件，this 的話會指的是 setTimeout
    controller.currentState = GAME_STATE.FirstCardAwaits
  }


}

const model = {
  // 集中管理資料
  // 宣告空陣列代表儲存被翻開的牌
  revealedCards: [],

  // 確認資料配對函式
  isRevealedCardMatched() {
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },

  score: 0,
  triedTimes: 0,
}


controller.generateCards() // 取代 view.displayCards()

// 監聽每一張卡片
// Node List (arr-like) 所以不能用 map (不是真的 arr)
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', e => {
    controller.dispatchCardAction(card)

  })
})

