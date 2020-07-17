const spotify = (method, path, params, body) => {
  return fetch(`https://api.spotify.com/v1/me/${path}?${params || ""}`, {
    method: method,
    body: body && JSON.stringify(body),
    headers: { "Authorization": `Bearer ${token}` },
  }).then(response => {
    if (response.ok) return response;
    else throw Error(response.statusText);
  });
};
