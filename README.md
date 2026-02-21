# 🧮 Aprendemos Jugando — Tug-of-War Math Game

![Version](https://img.shields.io/badge/version-1.0.0-orange)
![React](https://img.shields.io/badge/React-18+-blue)
![License](https://img.shields.io/badge/license-MIT-green)

> Juego interactivo y didáctico de **Jalar la Cuerda Matemática** para 2 equipos.  
> Diseñado para incentivar el aprendizaje de matemáticas básicas de forma social y divertida.

---

## 📸 Vista previa

```
┌────────────┐    ┌─────────────────┐    ┌────────────┐
│  EQUIPO 1  │    │  🎮 TUG VISUAL  │    │  EQUIPO 2  │
│  12 + 7=?  │    │  ~~~~O~~~~      │    │  15 - 8=?  │
│  [Teclado] │    │  Animación      │    │  [Teclado] │    
│  [ENVIAR]  │    │  Canvas         │    │  [ENVIAR]  │
└────────────┘    └─────────────────┘    └────────────┘
```

---

## 🚀 Instalación rápida

### Opción A — Vite + React (recomendado)

```bash
# 1. Crear proyecto Vite
npm create vite@latest aprendemos-jugando -- --template react

# 2. Entrar al proyecto
cd aprendemos-jugando

# 3. Instalar dependencias
npm install

# 4. Reemplazar src/App.jsx con el archivo incluido
cp path/to/App.jsx src/App.jsx

# 5. Limpiar App.css e index.css (opcional, el juego tiene estilos inline)
echo "" > src/App.css
echo "* { margin: 0; padding: 0; box-sizing: border-box; } body { overflow-x: hidden; }" > src/index.css

# 6. Correr en desarrollo
npm run dev
```

### Opción B — Create React App

```bash
npx create-react-app aprendemos-jugando
cd aprendemos-jugando
cp path/to/App.jsx src/App.js
npm start
```

---

## 📁 Estructura del proyecto

```
aprendemos-jugando/
├── src/
│   └── App.jsx              ← Componente principal (todo en uno)
├── public/
│   └── index.html
├── README.md                ← Este archivo
├── CHANGELOG.txt            ← Registro de cambios y versiones
├── GESTION_CAMBIOS.docx     ← Documento de gestión formal de cambios
├── package.json
└── vite.config.js
```

---

## 🎮 Cómo jugar

1. **Selecciona operaciones**: Elige entre suma (+), resta (−), multiplicación (×) y/o división (÷).
2. **Inicia el juego**: Ambos equipos reciben preguntas simultáneamente.
3. **Responde con el teclado numérico**: Ingresa tu respuesta y presiona **ENVIAR**.
4. **Jala la cuerda**: Cada respuesta correcta mueve la cuerda hacia tu lado.
5. **Gana el mejor**: Después de 5 intentos por equipo, se declara al ganador.

---

## ⚙️ Configuración

Todas las constantes de configuración se encuentran en `src/App.jsx`:

| Constante       | Descripción                         | Valor por defecto |
|----------------|-------------------------------------|-------------------|
| `MAX_ATTEMPTS` | Intentos por equipo por ronda       | `5`               |
| `OPS`          | Operaciones disponibles             | `+, −, ×, ÷`     |
| `MOTIVATIONAL` | Mensajes motivadores finales        | Array de strings  |

### Cambiar dificultad de preguntas

Edita la función `genQuestion(opKey)` en `App.jsx`:

```javascript
// Suma básica (1-10) — nivel fácil
if (opKey === "sum") {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  return { a, b, op: "+", answer: a + b };
}

// Suma avanzada (1-50) — nivel difícil
if (opKey === "sum") {
  const a = Math.floor(Math.random() * 50) + 1;
  const b = Math.floor(Math.random() * 50) + 1;
  return { a, b, op: "+", answer: a + b };
}
```

---

## 🗺️ Roadmap (próximas versiones)

Consulta `GESTION_CAMBIOS.docx` para el detalle completo. Resumen:

- **v1.1** — Temporizador por pregunta + sonidos
- **v1.2** — Niveles de dificultad (Fácil / Medio / Difícil)
- **v1.3** — Modo multijugador en red (WebSockets)
- **v2.0** — Backend con autenticación, historial y ranking

---

## 🧩 Tecnologías utilizadas

- **React 18** — UI reactiva con hooks
- **Canvas API** — Animación del fondo y visualización de la cuerda
- **CSS-in-JS (inline)** — Estilos responsivos sin dependencias extra
- **Google Fonts** — `Fredoka One` para tipografía lúdica

---

## 📱 Responsividad

El juego se adapta a:
- 📱 **Móvil** (< 600px): Tarjetas apiladas verticalmente
- 💻 **Tablet / Desktop** (> 600px): Layout de 3 columnas

---

## 🤝 Contribuciones

1. Haz fork del repositorio
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Registra el cambio en `CHANGELOG.txt`
4. Haz commit: `git commit -m "feat: descripción del cambio"`
5. Abre un Pull Request

---

## 📄 Licencia

MIT © 2026 — Aprendemos Jugando

---

> *"El juego es el trabajo de la infancia."* — Jean Piaget
