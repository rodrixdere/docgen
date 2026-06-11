// docwizard/src/i18n/strings.ts
// All user-facing CLI strings organized by language.
// To add a new language: add a new key to STRINGS and LANGUAGES.

// Supported language codes
export type Lang = "en" | "es" | "zh";

// Maps user input (e.g. "spanish", "es") to an internal Lang code
export const LANG_ALIASES: Record<string, Lang> = {
  // English
  english: "en",
  en:      "en",
  // Spanish
  spanish: "es",
  español: "es",
  espanol: "es",
  es:      "es",
  // Chinese
  chinese:  "zh",
  mandarin: "zh",
  zh:       "zh",
};

// Metadata for each supported language (used in the --lang selector)
export const LANGUAGES: { lang: Lang; label: string; value: string }[] = [
  { lang: "en", label: "English",  value: "english"  },
  { lang: "es", label: "Spanish",  value: "spanish"  },
  { lang: "zh", label: "Chinese",  value: "chinese"  },
];

// All CLI strings indexed by language then key.
// Add new keys here and in every language block.
export const STRINGS: Record<Lang, Record<string, string>> = {
  en: {
    // Prompts
    guideLanguage:   "Guide language:",
    projectName:     "Project name:",
    whatDoesItDo:    "What does it do?",
    whoUsesIt:       "Who is going to use it?",
    howAccess:       "How does a user access it for the first time?",
    supportContact:  "Support contact:",
    optional:        "(optional)",
    minChars:        "Minimum {n} characters required.",
    // Output messages
    generatingGuide: "  Generating guide...",
    done:            " done",
    fileExists:      "{file} already exists. Overwrite it?",
    aborted:         "  Aborted. No file was written.",
    written:         "{file} written.",
    // Scan output
    scanComplete:    "Scan complete.",
    scanning:        "Scanning {path}...",
    langSaved:       "Default language set to {lang}.",
    langSession:     "Language: {lang} (this run only)",
    langDefault:     "Language: {lang} (saved default)",
    // Help
    helpTitle:       "docwizard — project user guide generator",
    helpUsage:       "Usage:",
    helpCmd1:        "  docwizard                               Scan current directory",
    helpCmd2:        "  docwizard [output]                      Write guide to a custom file",
    helpCmd3:        "  docwizard --scan <path>                 Scan a specific directory",
    helpCmd4:        "  docwizard --lang <language>             Set default language permanently",
    helpCmd5:        "  docwizard --lang <language> --scan <p>  Use language for this run only",
    helpCmd6:        "  docwizard --reset-key                   Reset your saved Groq API key",
    helpCmd7:        "  docwizard --update                      Update to the latest version",
    helpCmd8:        "  docwizard --help                        Show this help message",
    helpLangs:       "Supported languages:",
    helpExamples:    "Examples:",
    helpConfig:      "Config:",
    helpConfigPath:  "  Stored at ~/.docgen/config.json",
    helpConfigEnv:   "  Set GROQ_API_KEY env var to skip the API key prompt.",
    helpUpdateOk:    "docwizard updated successfully.",
    helpUpdateFail:  "Update failed. Try running manually:",
    helpKeyCleared:  "API key cleared. Run docwizard again to enter a new one.",
  },

  es: {
    // Prompts
    guideLanguage:   "Idioma de la guía:",
    projectName:     "Nombre del proyecto:",
    whatDoesItDo:    "¿Qué hace?",
    whoUsesIt:       "¿Quién lo va a usar?",
    howAccess:       "¿Cómo accede un usuario por primera vez?",
    supportContact:  "Contacto de soporte:",
    optional:        "(opcional)",
    minChars:        "Mínimo {n} caracteres requeridos.",
    // Output messages
    generatingGuide: "  Generando guía...",
    done:            " listo",
    fileExists:      "{file} ya existe. ¿Sobreescribir?",
    aborted:         "  Cancelado. No se escribió ningún archivo.",
    written:         "{file} escrito.",
    // Scan output
    scanComplete:    "Escaneo completo.",
    scanning:        "Escaneando {path}...",
    langSaved:       "Idioma predeterminado establecido: {lang}.",
    langSession:     "Idioma: {lang} (solo esta vez)",
    langDefault:     "Idioma: {lang} (predeterminado guardado)",
    // Help
    helpTitle:       "docwizard — generador de guías de usuario",
    helpUsage:       "Uso:",
    helpCmd1:        "  docwizard                               Escanea el directorio actual",
    helpCmd2:        "  docwizard [salida]                      Escribe la guía en un archivo personalizado",
    helpCmd3:        "  docwizard --scan <ruta>                 Escanea un directorio específico",
    helpCmd4:        "  docwizard --lang <idioma>               Establece el idioma predeterminado",
    helpCmd5:        "  docwizard --lang <idioma> --scan <r>    Usa el idioma solo para esta ejecución",
    helpCmd6:        "  docwizard --reset-key                   Restablece tu clave Groq guardada",
    helpCmd7:        "  docwizard --update                      Actualiza a la última versión",
    helpCmd8:        "  docwizard --help                        Muestra este mensaje de ayuda",
    helpLangs:       "Idiomas disponibles:",
    helpExamples:    "Ejemplos:",
    helpConfig:      "Configuración:",
    helpConfigPath:  "  Guardado en ~/.docgen/config.json",
    helpConfigEnv:   "  Define GROQ_API_KEY como variable de entorno para omitir el prompt.",
    helpUpdateOk:    "docwizard actualizado correctamente.",
    helpUpdateFail:  "Actualización fallida. Intenta ejecutar manualmente:",
    helpKeyCleared:  "Clave API eliminada. Ejecuta docwizard nuevamente para ingresar una nueva.",
  },

  zh: {
    // Prompts
    guideLanguage:   "指南语言：",
    projectName:     "项目名称：",
    whatDoesItDo:    "它是做什么的？",
    whoUsesIt:       "谁会使用它？",
    howAccess:       "用户如何首次访问它？",
    supportContact:  "支持联系方式：",
    optional:        "（可选）",
    minChars:        "至少需要 {n} 个字符。",
    // Output messages
    generatingGuide: "  正在生成指南...",
    done:            " 完成",
    fileExists:      "{file} 已存在。是否覆盖？",
    aborted:         "  已取消。未写入任何文件。",
    written:         "{file} 已写入。",
    // Scan output
    scanComplete:    "扫描完成。",
    scanning:        "正在扫描 {path}...",
    langSaved:       "默认语言已设置为 {lang}。",
    langSession:     "语言：{lang}（仅本次）",
    langDefault:     "语言：{lang}（已保存默认值）",
    // Help
    helpTitle:       "docwizard — 项目用户指南生成器",
    helpUsage:       "用法：",
    helpCmd1:        "  docwizard                               扫描当前目录",
    helpCmd2:        "  docwizard [输出]                        将指南写入自定义文件",
    helpCmd3:        "  docwizard --scan <路径>                 扫描特定目录",
    helpCmd4:        "  docwizard --lang <语言>                 永久设置默认语言",
    helpCmd5:        "  docwizard --lang <语言> --scan <路径>   仅本次使用该语言",
    helpCmd6:        "  docwizard --reset-key                   重置已保存的 Groq API 密钥",
    helpCmd7:        "  docwizard --update                      更新到最新版本",
    helpCmd8:        "  docwizard --help                        显示此帮助信息",
    helpLangs:       "支持的语言：",
    helpExamples:    "示例：",
    helpConfig:      "配置：",
    helpConfigPath:  "  存储于 ~/.docgen/config.json",
    helpConfigEnv:   "  设置 GROQ_API_KEY 环境变量以跳过 API 密钥提示。",
    helpUpdateOk:    "docwizard 更新成功。",
    helpUpdateFail:  "更新失败。请尝试手动运行：",
    helpKeyCleared:  "API 密钥已清除。再次运行 docwizard 以输入新密钥。",
  },
};

// Resolves a string by language and key with variable interpolation.
// Falls back to English if the key is missing in the target language.
export function t(lang: Lang, key: string, vars: Record<string, string | number> = {}): string {
  let str = STRINGS[lang]?.[key] ?? STRINGS["en"][key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replace(`{${k}}`, String(v));
  }
  return str;
}