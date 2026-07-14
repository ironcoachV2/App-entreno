# IronCoach v2.3.2 — Corrección de desnivel y RPE

## Correcciones
- El RPE importado mueve ahora la barra y actualiza su valor visible.
- El desnivel se mantiene aunque los campos dinámicos se reconstruyan al detectar la disciplina.
- Se guarda el desnivel aunque el campo visual no exista en una disciplina.
- Nuevos alias aceptados:
  - ALTITUD
  - ALTITUD POSITIVA
  - DESNIVEL
  - DESNIVEL POSITIVO
  - ELEVACIÓN
  - ELEVACIÓN POSITIVA
  - ASCENSO
  - ASCENSO TOTAL
- La fecha acepta FECHA o DIA, aunque el valor diario actual sigue siendo el fallback.

## Formato recomendado para desnivel
`DESNIVEL=450 m`

También se acepta:
`ALTITUD=450 m`
