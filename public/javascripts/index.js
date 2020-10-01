const links = document.querySelectorAll('.btn');
const urlParams = new URLSearchParams(window.location.search);

if (urlParams.has('page')) {
  links.forEach(link => {
    if (link.innerText == urlParams.get('page')) {
      console.log(link);
      // link.style.background-color = '#eee';
      // link.style.border-color = '#adadad';
      link.className = 'btn btn-default active';
    } 
  });
}
