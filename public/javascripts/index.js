// selects pagination links
const links = document.querySelectorAll('.btn');
// selects url querry
const urlParams = new URLSearchParams(window.location.search);

// checks if query includes page
if (urlParams.has('page')) {
  links.forEach(link => {
    // checks if query page is similar to pagination link text
    if (link.innerText == urlParams.get('page')) {
      link.className = 'btn btn-default active';
    }
  }); 
// checks if pathname = books
} else if (window.location.pathname === '/books') {
  links[0].className = 'btn btn-default active';
}

if (window.location.pathname === '/books/isbn') {
  const input = document.querySelector('.isbn');
  const submit = document.querySelector('.submit');

  submit.disabled = true;

  input.addEventListener('keyup', e => {
    if (/^\d{13}$|^\d{10}$/.test(input.value)) {
      submit.disabled = false;
    } else {
      submit.disabled = true;
    }
  });
}
