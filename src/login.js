const form = document.getElementById('login-form')
const cancel = document.getElementById('cancel-login')

form?.addEventListener('submit', (event) => {
  event.preventDefault()
})

cancel?.addEventListener('click', () => {
  window.close()
})
