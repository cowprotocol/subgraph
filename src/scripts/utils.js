function prompt({ callbackYes, callbackNo, message }) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  })

  readline.question(message + ' ', answer => {
    let replied
    const answerLower = answer.toLowerCase()
    if (answerLower === 'y' || answerLower === 'yes') {
      replied = true
      callbackYes()
    } else if (answerLower === 'n' || answerLower === 'no') {
      replied = true
      callbackNo()
    } else {
      replied = false
    }
    readline.close()

    if (!replied) {
      prompt({ callbackYes, callbackNo, message })
    }
  })
}


function confirm({ callbackYes, callbackNo, message = "Are you sure you want to continue?" }) {  
  prompt({ callbackYes, callbackNo, message })
}

module.exports = {
  confirm
}