(() => {
  const app = globalThis.__clarity;
  app.adapters.httpbin = {
    id: 'httpbin',
    matches(doc, url) {
      const form = doc.querySelector('form');
      return url.origin === 'https://httpbin.org' && url.pathname === '/forms/post' &&
        this.validate(form);
    },
    validate(form) {
      return !!form && form.getAttribute('action') === '/post' && form.method === 'post' &&
        ['custname', 'custtel', 'custemail', 'size', 'topping', 'delivery', 'comments']
          .every(name => form.querySelector(`[name="${name}"]`));
    }
  };
})();
