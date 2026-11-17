# KMS-1 Web

Port symulacji dynamiki molekularnej argonu [KMS-1](https://github.com/OskarKinomoto/KMS-1) (C++/AVX/GLUT) do przeglądarki.

- `src/sim/simulation.ts` — fizyka (Lennard-Jones, ściana sferyczna, Verlet), 1:1 z `Simulation.cpp`
- `src/sim/worker.ts` — symulacja w Web Workerze, migawki co ~16 ms
- `src/render.ts` — Three.js (WebGL), atomy kolorowane energią kinetyczną
- `src/chart.ts` — wykres T i P w czasie

Uruchomienie: `source ~/.nvm/nvm.sh && nvm use && npm i && npm run dev`. Test zachowania energii: `npm test`.
Parametry (n, T₀, τ, a, L, f, ε) edytowalne w panelu; Reset przelicza od nowa.

Import/eksport: „Wczytaj parm.conf” (klucze n, f, L, tau, T_o, a), „Zapisz .xyz” (format jmol, jak `dat.xyz` w oryginale), „Zapisz stats” (TSV: t H V T P Ekin). Nagranie klatek jest ograniczone limitem pamięci.

Deploy na GitHub Pages: `./deploy.sh` (build + push na gałąź gh-pages).
