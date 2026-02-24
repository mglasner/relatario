# Herramientas para escritores en VSCode

Guía para configurar Visual Studio Code como entorno de escritura creativa,
optimizado para escribir los cuentos de El Relatario en markdown.

## Extensiones recomendadas

### Escritura de ficción

| Extensión | ID | Para qué |
|---|---|---|
| **Markdown Fiction Writer** | `vsc-zoctarine.markdown-fiction-writer` | Motor de escritura de ficción: estadísticas de documento, formato de diálogo, exportar, etiquetas de archivo, highlighting de prosa |
| **Markdown All in One** | `yzhang.markdown-all-in-one` | Atajos para headings, listas, tabla de contenidos, preview en vivo |
| **Word Count** | `ms-vscode.wordcount` | Contador de palabras en la barra de estado — útil para metas diarias |
| **Bookmarks** | `alefragnani.bookmarks` | Marcadores para navegar entre secciones de un capítulo largo |

### Corrección ortográfica

| Extensión | ID | Para qué |
|---|---|---|
| **Code Spell Checker** | `streetsidesoftware.code-spell-checker` | Corrector ortográfico integrado en el editor |
| **Spanish - Code Spell Checker** | `streetsidesoftware.code-spell-checker-spanish` | Diccionario español para el spell checker |

## Configuración del editor

Agregar en `.vscode/settings.json` para que los archivos markdown se comporten
como un entorno de escritura:

```json
{
    "[markdown]": {
        "editor.wordWrap": "wordWrapColumn",
        "editor.wordWrapColumn": 80,
        "editor.lineNumbers": "off",
        "editor.minimap.enabled": false,
        "editor.rulers": [],
        "editor.fontSize": 16,
        "editor.lineHeight": 28,
        "editor.padding.top": 40,
        "editor.fontFamily": "'Georgia', 'Lora', serif",
        "editor.quickSuggestions": false,
        "editor.suggestOnTriggerCharacters": false,
        "editor.acceptSuggestionOnCommitCharacter": false,
        "editor.tabCompletion": "off"
    },
    "cSpell.language": "es,en",
    "cSpell.words": [
        "DonBu", "Pamelota", "Topete", "Pototo",
        "Relatario", "Heroario", "Villanario"
    ]
}
```

### Qué hace cada configuración

- **wordWrap / wordWrapColumn**: Ajusta el texto a 80 columnas sin cortar
  palabras — como un editor de texto clásico
- **lineNumbers off**: Oculta los números de línea para reducir distracciones
- **minimap off**: Sin miniatura del archivo a la derecha
- **fontSize 16 / lineHeight 28**: Texto grande y con buen espacio para leer
  cómodamente
- **padding.top 40**: Espacio arriba del texto para que no se pegue al borde
- **fontFamily Georgia/Lora**: Tipografía serif legible, como un libro real
- **quickSuggestions off**: Desactiva autocompletado — al escribir prosa no
  quieres que VSCode sugiera código
- **cSpell**: Corrector ortográfico en español + nombres propios del universo

## Zen Mode: escritura sin distracciones

VSCode tiene un modo de concentración que oculta toda la interfaz excepto el
editor. Ideal para sesiones de escritura.

### Activar

- Atajo: `Ctrl+K Z` (presionar Ctrl+K, soltar, presionar Z)
- O desde el menú: View > Appearance > Zen Mode
- Salir: presionar `Esc` dos veces

### Configuración recomendada

```json
{
    "zenMode.fullScreen": true,
    "zenMode.centerLayout": true,
    "zenMode.hideTabs": "multiple",
    "zenMode.hideLineNumbers": true,
    "zenMode.hideStatusBar": false
}
```

La barra de estado se deja visible para poder ver el contador de palabras
(Word Count).

## Snippets para escritura

Crear `.vscode/cuento.code-snippets` con atajos útiles al escribir:

```json
{
    "Separador de escena": {
        "scope": "markdown",
        "prefix": "escena",
        "body": ["", "---", "", "$0"],
        "description": "Inserta un separador de escena (línea horizontal)"
    },
    "Diálogo": {
        "scope": "markdown",
        "prefix": "dialogo",
        "body": ["> — $1", "", "$0"],
        "description": "Bloque de diálogo con raya de apertura"
    },
    "Nota del autor": {
        "scope": "markdown",
        "prefix": "nota",
        "body": ["<!-- NOTA: $0 -->"],
        "description": "Comentario HTML invisible para notas del autor"
    }
}
```

### Uso

Al escribir en un archivo `.md`, escribe el prefijo (por ejemplo `escena`) y
presiona `Tab` para expandir el snippet.

## Extensiones recomendadas del proyecto

Crear `.vscode/extensions.json` para que VSCode sugiera instalar estas
extensiones al abrir el proyecto:

```json
{
    "recommendations": [
        "vsc-zoctarine.markdown-fiction-writer",
        "streetsidesoftware.code-spell-checker",
        "streetsidesoftware.code-spell-checker-spanish",
        "yzhang.markdown-all-in-one",
        "ms-vscode.wordcount",
        "alefragnani.bookmarks"
    ]
}
```

## Workflow de escritura

1. Crear un cuento nuevo: `npm run nuevo-cuento "Título del cuento"`
2. Abrir el archivo `.md` del primer capítulo
3. Activar Zen Mode (`Ctrl+K Z`)
4. Escribir. El word count aparece en la barra de estado
5. Usar `escena` + Tab para separadores, `dialogo` + Tab para diálogos
6. Para probar cómo se ve en la app: cambiar `publicado: true` en `libro.yaml`
   y abrir `npm run dev`
7. Cuando el cuento esté listo, dejar `publicado: true` y hacer commit

## Referencias

- [Markdown Fiction Writer (marketplace)](https://marketplace.visualstudio.com/items?itemName=vsc-zoctarine.markdown-fiction-writer)
- [Markdown Fiction Writer (docs)](https://zoctarine.github.io/vscode-fiction-writer/)
- [Writing Novels with VSCode (Jay Penner)](https://jaypenner.com/blog/writing-novels-and-non-fiction-with-visual-studio-code/)
- [VS Code Tips and Tricks (oficial)](https://code.visualstudio.com/docs/getstarted/tips-and-tricks)
- [VS Code for Writers (marketplace)](https://marketplace.visualstudio.com/items?itemName=danspinola.vscode-for-writers)
