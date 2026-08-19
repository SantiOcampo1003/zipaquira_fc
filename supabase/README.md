# Supabase — plantel y partidos

## 1. Crear tabla `players`

En [Supabase](https://supabase.com/dashboard) → tu proyecto → **SQL Editor** → pega y ejecuta:

`supabase/migrations/001_players.sql`

## 2. Insertar 36 jugadores de ejemplo

En el mismo **SQL Editor**, ejecuta:

`supabase/seed/players.sql`

## 3. Verificar

**Table Editor** → `players` → deberías ver 36 filas.

| Posición | Código | Cantidad |
|----------|--------|----------|
| Porteros | GK     | 3        |
| Defensas | DF     | 11       |
| Medios   | MF     | 12       |
| Delanteros | FW   | 10       |

## 4. Editar después

Desde **Table Editor** puedes cambiar `full_name`, `jersey_number`, `position`, `position_detail` y subir `photo_url` cuando tengas fotos reales.

### Códigos de posición

- `GK` — Portero  
- `DF` — Defensa  
- `MF` — Mediocampista  
- `FW` — Delantero  

## 5. Partidos, convocatoria y calificaciones

Ejecuta en orden en **SQL Editor**:

1. `migrations/002_matches.sql`
2. `migrations/003_match_squad.sql`
3. `migrations/004_player_ratings.sql`
4. `seed/match_inaugural.sql` — partido vs Sabana + 18 convocados de ejemplo
5. `seed/match_friendly.sql` — amistoso (opcional; edita rival y fecha)

## 6. Login con Google (hinchas y admin)

### Supabase → Authentication

1. **URL Configuration**
   - **Site URL (local):** `http://localhost:3000`
   - **Site URL (producción):** `https://zipaquira-fc-eta.vercel.app`
   - **Redirect URLs** (agrega todas; el wildcard evita fallos con `?next=`):
     - `http://localhost:3000/**`
     - `https://zipaquira-fc-eta.vercel.app/**`
     - O explícitas: `http://localhost:3000/auth/callback` y la misma en producción

   Si falta `/auth/callback` en Redirect URLs, Supabase manda el `?code=` a la **Site URL** (`/`). Eso rompe el login hasta que lo corrijas o uses el middleware del proyecto.

2. **Providers → Google** → activar y pegar Client ID + Client Secret

### Google Cloud Console

1. [console.cloud.google.com](https://console.cloud.google.com/) → nuevo proyecto (o existente)
2. **APIs & Services → OAuth consent screen** → External → completar nombre del app
3. **Credentials → Create OAuth client ID → Web application**
4. **Authorized JavaScript origins:**
   - `http://localhost:3000`
   - `https://tu-dominio.vercel.app`
5. **Authorized redirect URIs** (copia exacta desde Supabase → Auth → Google):
   - `https://irotkgjkmtkjvcxnzujf.supabase.co/auth/v1/callback`
6. Copia Client ID y Secret → Supabase → Google provider

La hincha entra con **Entrar con Google** en el header. El admin en `/admin` con la misma cuenta Google (`santi.720001@gmail.com`).

### Crear un partido nuevo (ej. amistoso)

1. Inserta fila en `matches` (rival, fecha, competición, slug único).
2. Inserta 18 filas en `match_squad` (11 titulares con `pitch_slot`, 7 suplentes con `bench_order`).
3. El partido aparece solo en la sección **Partidos** del sitio.

Usa `seed/match_friendly.sql` como plantilla.

## 8. Panel admin (`/admin`)

Ejecuta `migrations/005_admin.sql` (tabla `admin_users` + columna `is_featured`).

Admin configurado: **santi.720001@gmail.com**

1. Entra a `/admin` en local o producción
2. **Entrar con Google** con `santi.720001@gmail.com`
3. Desde ahí: crear partidos, destacar en la web, editar jugadores y armar convocatoria

Para agregar otro admin:

```sql
insert into admin_users (email) values ('otro@correo.com');
```

## 7. Volver a cargar seeds

Si quieres empezar de cero (en orden):

```sql
truncate table public.player_ratings, public.match_squad, public.matches, public.players cascade;
```

Luego vuelve a ejecutar `seed/players.sql` y `seed/match_inaugural.sql`.

## 8. MVP de la hinchada

Ejecuta en **SQL Editor**:

`supabase/migrations/006_match_mvp.sql`

En **`/admin` → Convocatoria**, al final verás la sección **MVP de la hinchada**:

1. Revisa el top de jugadores mejor calificados.
2. Pulsa **Calcular y publicar MVP** cuando cierres la votación.
3. El ganador aparece en la web con banner dorado en la sección Partidos.
