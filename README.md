[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/owaissaleemjokhio/easystructor/blob/master/LICENSE.md)


# 🛠️ Easystructor — Laravel & Full-Stack Code Generator for VS Code

**Easystructor** is a Visual Studio Code extension that automates the generation of clean, scalable boilerplate code for modern backend frameworks. Currently focused on Laravel (Service/Repository/DDD structure), support for NestJS, Django, and Spring is coming soon.

---

## ✨ Features

### ✅ Laravel Support (Advanced)
- 🔧 Generate full CRUD modules:
  - 🧩 Model (with `$fillable`, `$attributes`)
  - 🛡️ Form Request (with accurate validation)
  - ⚙️ Controller (uses Service pattern)
  - 📦 Service class (with filters, pagination, find/store/update/delete)
  - 🎯 Resource class
- ⚙️ Auto-register `Route::apiResource(...)`
- 🧹 Auto-revert/delete a complete module
- 🔁 Centralized JSON Response and Exception-friendly structure
- 🧠 Intelligent field parser:
  - Supports syntax like:  
    `name:string, is_active:boolean:nullable:default(true), type:enum:allowed(admin,user):default(user)`
  - Handles nullable, default, enum, and type-specific validation/migration
- 🔍 Service filters based on field types (text vs exact match)
- 📦 Artisan-based dynamic stub generation and cleanup
- 📦 Clean modular folder structure
- 🧪 Field Types Supported:
  - `string`, `text`, `integer`, `bigint`, `float`, `decimal`
  - `boolean`, `enum`, `date`, `datetime`, `time`, `json`

---

## 📦 Example Input

```text
name:string,
email:string:nullable,
price:decimal:default(0.00),
is_active:boolean:default(true),
role:enum:allowed(admin,user):default(user),
registered_at:datetime:nullable
```

### 🧾 Output: Migration

```php
$table->string('name');
$table->string('email')->nullable();
$table->decimal('price', 10, 2)->default(0.00);
$table->boolean('is_active')->default(true);
$table->enum('role', ['admin', 'user'])->default('user');
$table->dateTime('registered_at')->nullable();
```

### 🧾 Output: Validation Rules

```php
'name' => 'required|string',
'email' => 'nullable|string',
'price' => 'required|numeric',
'is_active' => 'required|boolean',
'role' => 'required|in:admin,user',
'registered_at' => 'nullable|date',
```

### 🧾 Output: Service Filters

```php
->when(isset($filters['name']), fn($q) => $q->where('name', 'like', '%' . $filters['name'] . '%'))
->when(isset($filters['price']), fn($q) => $q->where('price', $filters['price']))
->when(isset($filters['is_active']), fn($q) => $q->where('is_active', $filters['is_active']))
```

---

## 🚀 Getting Started

### 1. Install Extension

Install from the VS Code Marketplace or via `.vsix`.

```bash
ext install easystructor.easystructor
```

---

## 💻 Usage

### 🛠️ Generate CRUD Module

1. Open a Laravel project in VS Code.
2. Open the Command Palette:  
   `Ctrl + Shift + P` / `Cmd + Shift + P`
3. Run:  
   `Easystructor: Generate CRUD Module`
4. Enter module name (e.g. `Product`)
5. Enter fields in this format:  
   `name:string, price:decimal:default(0.00), status:boolean:default(true)`

---

### 🔁 Revert a Module

To delete the full CRUD module (Model, Controller, etc.):  
Run: `Easystructor: Revert CRUD Module`

---

## 📁 Output Structure

```
app/
├── Models/Product.php
├── Http/
│   ├── Controllers/ProductController.php
│   ├── Requests/ProductRequest.php
│   ├── Resources/ProductResource.php
├── Services/ProductService.php
routes/
└── api.php (auto-updated)
```

---

## 🛣️ Roadmap

- [x] Laravel CRUD generator
- [x] Intelligent field parser (with enum/default/nullable)
- [x] Full modular architecture
- [x] Auto-revert CRUD
- [x] Auto-filter generation
- [x] Command palette support
- [x] JSON response handling
- [ ] NestJS & Django support (in progress)
- [ ] UI-based form input for fields
- [ ] In-editor preview before generation
- [ ] Artisan command customization via config

---

### License
This Easystructor package is open-source software licensed under the MIT License. See the [LICENSE](https://github.com/owaissaleemjokhio/easystructor/blob/master/LICENSE.md) file for more information.

### Contributions and Feedback
Contributions, issues, and feedback are welcome! If you encounter any problems or have suggestions for improvements, please feel free to create an issue on  [GitHub](https://github.com/owaissaleemjokhio/easystructor)


Thank you for using Easystructor to simplify your full-stack development workflow. We hope this extension speeds up your project scaffolding and helps you write clean, structured code effortlessly. If you have any questions or need support, don’t hesitate to reach out. Happy coding! 💻🚀