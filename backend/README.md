# SISTRA Backend

Backend minimal para manejar reasignados, tareas y enviados.

Instalación:

```bash
cd backend
npm install
```

Configuración de la base de datos mediante variables de entorno (opcional):

- `DB_HOST` (por defecto: localhost)
- `DB_USER` (por defecto: root)
- `DB_PASS` (por defecto: '')
- `DB_NAME` (por defecto: sistra)

Crear la base y tablas usando `backend/sql/schema.sql` en MySQL:

```sql
-- desde mysql client
SOURCE sql/schema.sql;
```

Iniciar servidor:

```bash
npm run dev
```

Endpoints principales:

- `GET /api/reasignados` - lista
- `POST /api/reasignados` - crear (JSON body)
- `GET /api/tareas` - lista
- `POST /api/tareas` - crear (JSON body)
- `GET /api/enviados` - lista
- `POST /api/enviados` - crear (JSON body)
- `POST /api/upload` - multipart form `file` (xlsx) para carga masiva

Migraciones:

Puedes aplicar migraciones SQL incluidas en `backend/migrations` con:

```bash
cd backend
npm run migrate
```

Por defecto la conexión usa la base `seguimiento_v2`. Ajusta `DB_HOST`, `DB_USER`, `DB_PASS` y `DB_NAME` mediante variables de entorno si es necesario.
