## Usage: hello

```python
from hello import hello

print(hello("Ada"))  # Hello, Ada!
```
Current version: 0.1.0

## TicTacToe

A TicTacToe page in plain HTML and CSS, served statically from `public/`. It needs no install and no build step, and makes no external requests.

### View it locally

Open `public/index.html` in a browser, or serve the folder and visit http://localhost:8000:

```sh
python3 -m http.server --directory public 8000
```

### Deployment on Upsun

`.upsun/config.yaml` defines one application that serves `public/` statically at the root route `https://{default}/`.

- Every pull request gets an Upsun preview environment, built from the PR branch and served over HTTPS at its own URL.
- Production follows the `main` branch: merging to `main` deploys the page to the production environment.
