# Guía de deploy (backend en Railway, frontend en Vercel)

Esto necesita tus propias cuentas — no lo puedo hacer por vos, pero el proyecto
ya está preparado para que sea copiar y pegar.

## 1. Backend en Railway

Railway es la opción más simple porque te da Postgres gestionado gratis y
detecta el proyecto Maven solo.

1. Entrá a [railway.app](https://railway.app) y creá una cuenta (podés usar tu GitHub).
2. **New Project → Deploy from GitHub repo** → elegí tu repo `enterprise-crm`.
3. Cuando te pregunte el **Root Directory**, poné `backend`.
4. Railway va a detectar que es un proyecto Maven y va a compilar solo. Si te pide
   un start command, poné: `java -Dserver.port=$PORT -jar target/*.jar`
5. **Agregá una base de datos**: dentro del mismo proyecto, `+ New → Database → PostgreSQL`.
   Railway crea las variables `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` solas.
6. En la pestaña **Variables** del servicio backend, agregá:
   ```
   SPRING_PROFILES_ACTIVE=postgresql
   SPRING_DATASOURCE_URL=jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}
   SPRING_DATASOURCE_USERNAME=${{Postgres.PGUSER}}
   SPRING_DATASOURCE_PASSWORD=${{Postgres.PGPASSWORD}}
   JWT_SECRET=<generá uno nuevo, ver abajo>
   ```
   Railway permite referenciar variables de otro servicio con `${{Postgres.VARIABLE}}` —
   así no copiás contraseñas a mano.
7. **Generar un JWT_SECRET propio** (nunca reuses el que está en el repo, ese es solo
   para desarrollo local). Corré esto en tu máquina y pegá el resultado:
   ```powershell
   # PowerShell
   [Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))
   ```
8. Deploy. Railway te da una URL pública tipo `https://enterprise-crm-backend-production.up.railway.app`
   — guardala, la necesitás para el frontend.
9. Probá que funciona entrando a `https://tu-url.up.railway.app/swagger-ui/index.html`.

## 2. Frontend en Vercel

1. Entrá a [vercel.com](https://vercel.com) y creá una cuenta con GitHub.
2. **Add New → Project** → elegí el mismo repo.
3. En **Root Directory**, poné `frontend`. Vercel detecta Vite automáticamente.
4. En **Environment Variables**, agregá:
   ```
   VITE_API_URL=https://tu-url-de-railway.up.railway.app
   ```
   (la URL del backend que copiaste en el paso anterior, sin la barra final)
5. Deploy. Vercel te da un link tipo `https://enterprise-crm-tuusuario.vercel.app`.

## 3. Un ajuste de CORS a tener en cuenta

`SecurityConfig.java` hoy permite CORS desde cualquier origen (`allowedOriginPatterns: "*"`),
lo cual está bien para desarrollo pero no es lo más prolijo en producción. Una vez que
tengas la URL final de Vercel, si querés endurecerlo, cambiá en `SecurityConfig.java`:

```java
config.setAllowedOriginPatterns(java.util.List.of("*"));
```
por:
```java
config.setAllowedOriginPatterns(java.util.List.of("https://enterprise-crm-tuusuario.vercel.app"));
```

No es obligatorio para que funcione, pero es la diferencia entre "funciona" y
"está pensado para producción" si alguien lee el código.

## Alternativa: Render en vez de Railway

Ya dejé un `backend/render.yaml` con la configuración base por si preferís Render
en vez de Railway (occasionalmente Railway cambia sus límites del plan gratis).
El flujo es el mismo: conectás el repo, Render lee el `render.yaml`, y las
variables de datasource las completás vos a mano con los datos de conexión que
te da su Postgres gestionado (pestaña "Connect" de la base de datos).
