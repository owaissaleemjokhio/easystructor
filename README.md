[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/owaissaleemjokhio/easystructor/blob/master/LICENSE.md)


<p align="center">
<img src="https://demo-cmolds1.com/projects/hylpers_be/public/logo.png" alt="Easystructor" width="100%" />
</p>

# Easystructor

**Easystructor** is a Visual Studio Code extension that helps you generate full-stack boilerplate code quickly using predefined project structures and custom logic. Currently supports Laravel (Service/Repository/DDD structure), and is designed to support more frameworks like NestJS, Django, and Spring soon.

## 🌟 Features

- 🔧 Generate full CRUD modules for Laravel:
  - Model
  - Controller (with Service injection)
  - Form Request
  - Resource
  - Service class
- 🔁 Revert/Delete a complete CRUD module with route cleanup
- ⚙️ Auto-register routes (e.g., `Route::apiResource(...)`)
- 🧠 Intelligent stubs and file generation using custom artisan and logic
- 📦 Clean modular code structure (controllers, services, models separated)
- ⚡ CLI-based and UI-based prompts
- 🔌 Future-ready for multi-framework support (NestJS, Django, etc.)

---

## Usage

1. Open a Laravel project in VS Code.
2. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
3. Run: `Easystructor: Generate CRUD Module`
4. Provide module name (e.g. `Product`)
5. Select generation options.

To revert a module:

- Run: `Easystructor: Revert CRUD Module`

## Output Example

```
app/
├── Models/Product.php
├── Http/Controllers/ProductController.php
├── Http/Requests/ProductRequest.php
├── Http/Resources/ProductResource.php
├── Services/ProductService.php

routes/
└── api.php
```


## 🚀 Getting Started

### 1. Install

Install the extension via VS Code Marketplace (or manually via `.vsix`).

```bash
ext install your-publisher-name.easystructor
```

## Usage

1. Open a Laravel project in VS Code.
2. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
3. Run: `Easystructor: Generate CRUD Module`
4. Provide module name (e.g. `Product`)
5. Select generation options.

To revert a module:

- Run: `Easystructor: Revert CRUD Module`

## Output Example

```
app/
├── Models/Product.php
├── Http/Controllers/ProductController.php
├── Http/Requests/ProductRequest.php
├── Http/Resources/ProductResource.php
├── Services/ProductService.php
routes/
└── api.php
```



### License
This MezPay package is open-source software licensed under the MIT License. See the [LICENSE](https://github.com/owaissaleemjokhio/easystructor/blob/master/LICENSE.md) file for more information.

### Contributions and Feedback
Contributions, issues, and feedback are welcome! If you encounter any problems or have suggestions for improvements, please feel free to create an issue on  [GitHub](https://github.com/owaissaleemjokhio/easystructor)


Thank you for using Easystructor to simplify your full-stack development workflow. We hope this extension speeds up your project scaffolding and helps you write clean, structured code effortlessly. If you have any questions or need support, don’t hesitate to reach out. Happy coding! 💻🚀