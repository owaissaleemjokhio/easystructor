const vscode = window.acquireVsCodeApi ? acquireVsCodeApi() : null;

// ========== POSTMAN COLLECTION HANDLING ==========

// Get or initialize Postman Collection
function getOrInitPostmanCollection() {
    let stored = localStorage.getItem("postman_collection");
    if (stored) {
        return JSON.parse(stored);
    }

    const newCollection = {
        info: {
            name: "Easystructor API",
            schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        item: [],
        variable: [
            { key: "base_url", value: "http://localhost:8000/api" },
            { key: "auth_token", value: "your_token_here" }
        ]
    };

    localStorage.setItem("postman_collection", JSON.stringify(newCollection));
    return newCollection;
}

// Save updated collection
function savePostmanCollection(collection) {
    localStorage.setItem("postman_collection", JSON.stringify(collection));
}

// Add new module CRUD endpoints into collection
function addModuleToPostmanCollection(moduleName, fields = []) {
    const plural = pluralize(moduleName).toLowerCase();
    const collection = getOrInitPostmanCollection();

    // Avoid duplicates
    if (collection.item.some(m => m.name === moduleName)) {
        showToast(`${moduleName} already exists in Postman collection`, "warning");
        return;
    }

    const moduleItem = {
        name: moduleName,
        item: [
            {
                name: `Get All ${plural}`,
                request: {
                    method: "GET",
                    url: {
                        raw: "{{ base_url }}/" + plural,
                        host: ["{{ base_url }}"],
                        path: [plural]
                    }
                }
            },
            {
                name: `Get Single ${moduleName}`,
                request: {
                    method: "GET",
                    url: {
                        raw: "{{ base_url }}/" + plural + "/:id",
                        host: ["{{ base_url }}"],
                        path: [plural, ":id"]
                    }
                }
            },
            {
                name: `Create ${moduleName}`,
                request: {
                    method: "POST",
                    header: [{ key: "Content-Type", value: "application/json" }],
                    body: {
                        mode: "raw",
                        raw: JSON.stringify(
                            fields.reduce((acc, f) => {
                                acc[f.name] =
                                    f.type === "integer"
                                        ? 0
                                        : f.type === "boolean"
                                            ? false
                                            : `${f.name}_sample`;
                                return acc;
                            }, {}),
                            null,
                            2
                        )
                    },
                    url: {
                        raw: "{{ base_url }}/" + plural,
                        host: ["{{ base_url }}"],
                        path: [plural]
                    }
                }
            },
            {
                name: `Update ${moduleName}`,
                request: {
                    method: "PUT",
                    header: [{ key: "Content-Type", value: "application/json" }],
                    body: {
                        mode: "raw",
                        raw: JSON.stringify(
                            fields.reduce((acc, f) => {
                                acc[f.name] =
                                    f.type === "integer"
                                        ? 1
                                        : f.type === "boolean"
                                            ? true
                                            : `${f.name}_updated`;
                                return acc;
                            }, {}),
                            null,
                            2
                        )
                    },
                    url: {
                        raw: "{{ base_url }}/" + plural + "/:id",
                        host: ["{{ base_url }}"],
                        path: [plural, ":id"]
                    }
                }
            },
            {
                name: `Delete ${moduleName}`,
                request: {
                    method: "DELETE",
                    url: {
                        raw: "{{ base_url }}/" + plural + "/:id",
                        host: ["{{ base_url }}"],
                        path: [plural, ":id"]
                    }
                }
            }
        ]
    };
    collection.item.push(moduleItem);
    savePostmanCollection(collection);

    showToast(` ${moduleName} added to Postman collection`, "success");
}

// Export full collection as JSON file
function exportFullPostmanCollection() {
    const collection = getOrInitPostmanCollection();
    const blob = new Blob([JSON.stringify(collection, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `easystructor_postman_collection.json`;
    a.click();

    URL.revokeObjectURL(url);
}

// Reset collection
function resetPostmanCollection() {
    localStorage.removeItem("postman_collection");
    showToast("Postman collection reset successfully.", "success");
}

// ========== REVERT AND IMPORT AND EXPORT HANDLING ==========
function openConfirmModal() {
    const moduleName = document.getElementById("moduleName").value;
    if (!moduleName) {
        showToast("Please enter a module name!", "warning");
        return;
    }
    document.getElementById("confirmModal").classList.remove("hidden");
}

function closeRevertModal() {
    document.getElementById("confirmModal").classList.add("hidden");
}

function confirmRevertCrud() {
    closeRevertModal();
    callRevertCrud();
}

function callRevertCrud() {
    const moduleName = document.getElementById("moduleName").value;
    if (!moduleName) {
        showToast("Please enter a module name!", "warning");
        return;
    }
    vscode.postMessage({
        command: "revertCrud",
        payload: { moduleName }
    });
}

function exportBoardData() {
    const boardName = document.getElementById("boardName")?.value || "myBoard";
    const modelName = document.getElementById("modelName")?.value || "myModel";

    // fields collect karo
    const fields = [];
    document.querySelectorAll('.field-row').forEach(row => {
        const name = row.querySelector('.field-name').value.trim();
        const type = row.querySelector('.field-type').value;
        const defaultVal = row.querySelector('.field-default').value.trim();
        const nullable = row.querySelector('.field-nullable').checked;
        const enumInput = row.querySelector('.field-enum-values');
        const enums = enumInput && !enumInput.classList.contains('hidden')
            ? enumInput.value.split(',').map(e => e.trim()).filter(e => e)
            : null;

        if (name && type) {
            fields.push({ name, type, default: defaultVal || null, nullable, enum: enums });
        }
    });

    // columns aur tasks localStorage se
    const columns = JSON.parse(localStorage.getItem("columns") || "[]");
    const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");

    const payload = { board: boardName, model: modelName, fields, columns, tasks };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `easystructor_${modelName}_full_config.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importBoardData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);

            // board aur model set karo
            const boardInput = document.getElementById("boardName");
            if (boardInput) boardInput.value = data.board || "";

            const modelInput = document.getElementById("modelName");
            if (modelInput) modelInput.value = data.model || "";

            // fields render
            const container = document.getElementById("fieldsContainer");
            if (container) {
                container.innerHTML = "";
                if (Array.isArray(data.fields)) {
                    data.fields.forEach(field => addFieldRow(field));
                }
            }

            addModuleToPostmanCollection(data.model, data.fields);


            columns = Array.isArray(data.columns) ? data.columns : [];
            tasks = Array.isArray(data.tasks) ? data.tasks : [];

            localStorage.setItem("columns", JSON.stringify(columns));
            localStorage.setItem("tasks", JSON.stringify(tasks));

            // board redraw
            if (typeof renderBoard === "function") {
                renderBoard();
            }

            showToast("Import successful!", "success");
        } catch (err) {
            showToast("Invalid JSON file", "error");
        }
    };
    reader.readAsText(file);
}

// ========== BOARD AND TASKS HANDLING ==========

let tasks = JSON.parse(localStorage.getItem("tasks") || "[]");

const colors = ["blue", "yellow", "green", "purple", "pink", "indigo", "orange"];
let colorIndex = 0;

function openAddColumnModal() {
    document.getElementById("addColumnModal").classList.remove("hidden");
}
function closeAddColumnModal() {
    document.getElementById("addColumnModal").classList.add("hidden");
}

function toggleEdit(id) {
    const el = document.getElementById(`edit-${id}`);
    el.classList.toggle("hidden");
}
// Toast system
function showToast(msg, type = "error") {
    const colors = {
        success: "bg-green-600",
        error: "bg-red-600",
        warning: "bg-yellow-500 text-black",
        info: "bg-blue-600"
    };

    // check if container already exists, else create
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.className = "fixed bottom-4 right-4 space-y-2 z-50";
        document.body.appendChild(container);
    }

    // remove previous toast (only keep one at a time)
    container.innerHTML = "";

    // create new toast
    const toast = document.createElement("div");
    toast.className = `${colors[type] || colors.error} text-white px-4 py-2 rounded-lg shadow-lg animate-bounce`;
    toast.innerText = msg;

    container.appendChild(toast);

    // auto remove after 3s
    setTimeout(() => {
        toast.remove();
    }, 3000);
}




// Save & Load
function saveColumns() {
    localStorage.setItem("columns", JSON.stringify(columns));
}
function loadColumns() {
    const saved = localStorage.getItem("columns");
    if (saved) {
        columns = JSON.parse(saved);
    } else {
        // default columns
        columns = [
            { id: "todo", title: "Todo", color: "blue", border: "border-blue-500" },
            { id: "inprogress", title: "In Progress", color: "yellow", border: "border-yellow-500" },
            { id: "done", title: "Done", color: "green", border: "border-green-500" }
        ];
        saveColumns();
    }
}

// Render Board
function renderBoard() {
    const board = document.getElementById("board");
    board.innerHTML = "";
    columns.forEach(col => {
        const colDiv = document.createElement("div");
        colDiv.className = `min-w-[300px] max-w-[300px] h-[500px] bg-gray-800 p-4 rounded-xl shadow-md border-t-4 ${col.border} flex flex-col`;


        colDiv.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <h2 class="text-lg font-bold text-${col.color}-400">${col.title}</h2>
                <div class="flex gap-2">
                    <button class="text-sm text-yellow-400" onclick="toggleEdit('${col.id}')">
                        <i class="fas fa-pen"></i></button>
                    <button class="text-sm text-red-400" onclick="deleteColumn('${col.id}')">
                    <i class="fas fa-trash"></i></button>
                </div>
            </div>

            <div id="edit-${col.id}" class="hidden mb-3">
                <div class="flex items-center gap-2">
                    <!-- Input -->
                    <input id="edit-input-${col.id}" 
                        class="flex-1 p-2 rounded-md bg-gray-800 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white text-sm outline-none transition" 
                        value="${col.title}" />

                    <!-- Small Save Button -->
                    <button onclick="editColumn('${col.id}')"
                            class="px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-md flex items-center gap-1 transition">
                    <i class="fas fa-check text-xs"></i>
                    Save
                    </button>
                </div>
            </div>
            `;

        const list = document.createElement("div");
        list.id = col.id;
        list.className = "task-list w-64 md:w-72 lg:w-80 h-80 bg-gray-700 rounded-lg border-2 border-dashed border-gray-500 p-3 text-gray-100 overflow-y-auto";
        colDiv.appendChild(list);

        const addBtn = document.createElement("button");
        addBtn.innerText = "Add Task";
        addBtn.className = `mt-3 px-4 py-2 w-full rounded-lg bg-${col.color}-500 text-white font-bold hover:bg-${col.color}-600 transition`;
        addBtn.onclick = () => openAddTaskModal(col.id);
        colDiv.appendChild(addBtn);

        board.appendChild(colDiv);
    });
    renderTasks();
}

// Render tasks
function renderTasks() {

    columns.forEach(col => {
        const container = document.getElementById(col.id);
        container.innerHTML = "";
        tasks.map((t, idx) => ({ ...t, idx }))
            .filter(t => t.status === col.id)
            .forEach(t => {
                const el = document.createElement("div");
                el.className = "task bg-gray-800 border border-gray-700 p-3 mb-3 rounded-xl shadow hover:shadow-lg transition cursor-move";


                el.draggable = true;
                el.ondragstart = e => e.dataTransfer.setData("taskId", t.idx);

                const title = document.createElement("span");
                title.innerText = t.title;
                title.className = "text-gray-100 font-medium break-all";

                const actions = document.createElement("div");
                actions.className = "flex gap-2 mt-2 justify-end";

                const editBtn = document.createElement("button");
                editBtn.innerHTML = `<i class="fas fa-pen"></i>`;
                editBtn.className = "p-2 rounded-md bg-yellow-500 hover:bg-yellow-600 text-white text-xs transition";
                editBtn.onclick = () => editTask(t.idx);

                const delBtn = document.createElement("button");
                delBtn.innerHTML = `<i class="fas fa-trash"></i>`;
                delBtn.className = "p-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs transition";
                delBtn.onclick = () => deleteTask(t.idx);

                const detailBtn = document.createElement("button");
                detailBtn.innerHTML = `<i class="fas fa-eye"></i>`;
                detailBtn.className = "p-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs transition";
                detailBtn.onclick = () => showDetail(t.idx);

                actions.append(editBtn, delBtn, detailBtn);
                el.append(title, actions);
                container.appendChild(el);
            });
    });

    document.querySelectorAll(".task-list").forEach(list => {
        list.ondragover = e => e.preventDefault();
        list.ondrop = e => {
            const id = e.dataTransfer.getData("taskId");
            tasks[id].status = list.id;
            localStorage.setItem("tasks", JSON.stringify(tasks));
            renderTasks();
        };
    });

    localStorage.setItem("tasks", JSON.stringify(tasks));
    saveColumns();
}

// Add column
function confirmAddColumn() {
    const input = document.getElementById("newColumnName");
    const title = input.value.trim();
    if (!title) return;
    const id = title.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    const color = colors[colorIndex % colors.length];
    colorIndex++;
    columns.push({ id, title, color, border: `border-${color}-500` });
    input.value = "";
    saveColumns();
    renderBoard();
    closeAddColumnModal();
}

// Edit column
function editColumn(id) {
    const col = columns.find(c => c.id === id);
    if (!col) return;
    const newTitle = document.getElementById(`edit-input-${id}`).value.trim();
    if (!newTitle) return;
    col.title = newTitle;
    saveColumns();
    renderBoard();
}

// Delete column
function deleteColumn(id) {
    const hasTasks = tasks.some(task => task.status === id); // FIX
    if (hasTasks) {
        showToast("Cannot delete column with tasks.", 'info');
        return;
    }
    columns = columns.filter(c => c.id !== id);
    saveColumns();
    renderBoard();
}

// INIT
loadColumns();


// ========== TASK FUNCTIONS ==========
let taskTargetColumn = null;
function openAddTaskModal(colId) {
    taskTargetColumn = colId;
    document.getElementById("addTaskModal").classList.remove("hidden");
}
function closeAddTaskModal() {
    document.getElementById("addTaskModal").classList.add("hidden");
}
function confirmAddTask() {
    const title = document.getElementById("newTaskTitle").value.trim();
    const desc = document.getElementById("newTaskDesc").value.trim();
    if (!title) return;
    tasks.push({ id: Date.now(), title, desc, status: taskTargetColumn });
    document.getElementById("newTaskTitle").value = "";
    document.getElementById("newTaskDesc").value = "";
    renderTasks();
    closeAddTaskModal();
}

let editIndex = null;
function editTask(index) {
    editIndex = index;
    document.getElementById("editTitle").value = tasks[index].title || "";
    document.getElementById("editDesc").value = tasks[index].desc || "";
    document.getElementById("editModal").classList.remove("hidden");
}
function saveEdit() {
    if (editIndex !== null) {
        tasks[editIndex].title = document.getElementById("editTitle").value.trim();
        tasks[editIndex].desc = document.getElementById("editDesc").value.trim();
        renderTasks();
    }
    closeEditModal();
}
function closeEditModal() {
    document.getElementById("editModal").classList.add("hidden");
}

let deleteIndex = null;
function deleteTask(index) {
    deleteIndex = index;
    document.getElementById("deleteModal").classList.remove("hidden");
}
function confirmDelete() {
    if (deleteIndex !== null) {
        tasks.splice(deleteIndex, 1);
        renderTasks();
        deleteIndex = null;
    }
    closeDeleteModal();
}
function closeDeleteModal() {
    document.getElementById("deleteModal").classList.add("hidden");
}

function showDetail(index) {
    document.getElementById("detailTitle").innerText = tasks[index].title;
    document.getElementById("detailDesc").innerText = tasks[index].desc || "No description.";
    document.getElementById("detailModal").classList.remove("hidden");
}
function closeDetail() {
    document.getElementById("detailModal").classList.add("hidden");
}

renderBoard();

// =========== CRUD AND PREVIEW HANDLING =========================

const fieldTypes = ['string', 'text', 'integer', 'decimal', 'boolean', 'date', 'datetime', 'enum'];

// Converts "UserService" -> "userService"
function toCamel(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
}

// Converts PascalCase or camelCase -> snake_case
// Example: "UserReferral" -> "user_referral"
function toSnake(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

// Build filters for service stub
function buildFilters(fields) {
    const filters = fields
        .map(f => {
            if (['string', 'text'].includes(f.type)) {
                return `->when(isset($filters['${f.name}']), fn($q) => $q->where('${f.name}', 'like', '%' . $filters['${f.name}'] . '%'))`;
            }
            if (['integer', 'bigint', 'boolean', 'float', 'decimal', 'enum', 'date', 'datetime', 'time'].includes(f.type)) {
                return `->when(isset($filters['${f.name}']), fn($q) => $q->where('${f.name}', $filters['${f.name}']))`;
            }
            return '';
        })
        .filter(Boolean)
        .join('\n        ');

    // Ensure clean return (with or without filters)
    return filters ? `\n        ${filters}` : '';
}
/* ---------------- STUB TEMPLATES ---------------- */
const stubTemplates = {
    model: `<?php
namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;

class {{model}} extends Model
{
    protected $fillable = [{{fillable}}];
}`,

    controller: `<?php
namespace App\\Http\\Controllers;


use App\\Http\\Requests\\{{model}}Request;
use App\\Http\\Resources\\PaginatedCollection;
use App\\Http\\Resources\\{{model}}Resource;
use App\\Services\\{{model}}Service;
use App\\Traits\\JsonResponse;


class {{model}}Controller extends Controller
{
    use JsonResponse;

    public function __construct(private {{model}}Service {{camelModelWithDollar}}Service) {}

    /**
     * Get All {{model}} list
     *
     * @return \\Illuminate\\Http\\JsonResponse|string
     * 
     */
    public function index(): \\Illuminate\\Http\\JsonResponse|string
    {
        $records = $this->{{camelModel}}Service->all();

       if (is_string(\$records)) {
            return \$this->response([], 404, [\$records] );
        }

        return \$this->response(
            new PaginatedCollection($records, '{{snakeModel}}', {{model}}Resource::class),
            200,
            [__('{{model}} list fetched successfully.')]
        );
    }

     /**
     * Save {{model}} Data
     *
     * @param {{model}}Request $request
     * @return \\Illuminate\\Http\\JsonResponse|array
     */
    public function store({{model}}Request \$request): \\Illuminate\\Http\\JsonResponse
    {
      \$record = \$this->{{camelModel}}Service->store(\$request);
      
      if (is_string(\$record)) {
          return \$this->response([], 404, [\$record] );
      }

      return \$this->response(
          ["{{snakeModel}}" => new {{model}}Resource(\$record)],
          201,
          [__('{{model}} created successfully.')]
      );
    }

    /**
     * Display the specified {{model}}.
     *
     * @param integer \$id
     * @return \\Illuminate\\Http\\JsonResponse
     */
    public function show(int \$id): \\Illuminate\\Http\\JsonResponse
    {
      \$record = \$this->{{camelModel}}Service->find(\$id);

      if (is_string(\$record)) {
          return \$this->response([], 404, [\$record]);
      }

      return \$this->response(
          ["{{snakeModel}}" => new {{model}}Resource(\$record)],
          200,
          [__('{{model}} fetched successfully.')]
      );
    }

    /**
     * Update the specified {{model}}.
     *
     * @param {{model}}Request $request
     * @param integer \$id
     * @return \\Illuminate\\Http\\JsonResponse
     */
    public function update({{model}}Request \$request, int \$id): \\Illuminate\\Http\\JsonResponse
    {
      \$record = \$this->{{camelModel}}Service->update(\$id, \$request);

      if (is_string(\$record)) {
          return \$this->response([], 404, [\$record]);
      }

      return \$this->response(
          ["{{snakeModel}}" => new {{model}}Resource(\$record)],
          200,
          [__('{{model}} updated successfully.')]
      );
    }

    /**
     * Delete the specified {{model}}.
     *
     * @param integer \$id
     * @return \\Illuminate\\Http\\JsonResponse
     */
    public function destroy(int \$id): \\Illuminate\\Http\\JsonResponse
    {
      \$deleted = \$this->{{camelModel}}Service->delete(\$id);

      if (is_string(\$deleted)) {
          return \$this->response([], 404, [\$deleted]);
      }

      return \$this->response([], 200, [__('{{model}} deleted successfully.')]);
    }
}`,


    migration: `Schema::create('{{table}}', function (Blueprint $table) {
    $table->id();
    {{fields}}
    $table->timestamps();
});`,

    request: `class {{model}}Request extends FormRequest
{
    public function rules()
    {
        return [
            {{rules}}
        ];
    }
}`,

    service: `<?php

namespace App\\Services;

use App\\Http\\Requests\\{{model}}Request;
use Illuminate\\Contracts\\Database\\Eloquent\\Builder;
use App\\Models\\{{model}};
use Illuminate\\Http\\Request;

final class {{model}}Service
{
    /**
     * {{model}}Service attributes
     *
     * @var array<int, string>
     */
    private array $attributes = [
        {{fillable}}
    ];

    /**
     * {{model}}Service Constructor
     */
    public function __construct(
        public {{model}} $model,
        public Request $request
    ) {}

    /**
     * Get all {{model}}
     *
     * @return array|null
     */
    public function all()
    {
        $query = $this->model;
        $filters = $this->request->all();

        if (count($filters) > 0) {
            $query = $this->applyFilters($query, $filters);
        }

        $records = $query->latest()->paginate($filters['per_page'] ?? 10);

        if (!$records) {
            return __('Records not found.');
        }

        return $records;
    }

    /**
     * Apply Filters
     *
     * @param [type] $query
     * @param [type] $filters
     * @return Builder
     */
     protected function applyFilters($query, array $filters): Builder
    {
        return $query{{filters}};
    }

    /**
     * Find a single {{model}}
     *
     * @param integer $id
     * @return {{model}}|string
     */
    public function find(int $id): {{model}}|string
    {
        $record = $this->model->find($id);
        if (!$record) {
            return __('record not found.');
        }
        return $record;
    }
    
    /**
     * Store a new {{model}}
     *
     * @param {{model}}Request $request
     * @return {{model}}|array
     */
    public function store({{model}}Request $request): {{model}}|array
    {
        $data = $request->only($this->attributes);
        return $this->model->create($data);
    }

    /**
     * Update an existing {{model}}
     *
     * @param integer $id
     * @param {{model}}Request $request
     * @return  {{model}}|string
     */
    public function update(int $id, {{model}}Request $request): {{model}}|string
    {
        $record = $this->model->find($id);

         if (!$record) {
            return __('Record not found.');
        }

        $data = $request->only($this->attributes);
        $record->update($data);
        return $record;
    }

    /**
     * Delete a {{model}}
     *
     * @param integer $id
     * @return {{model}}|string
     */
    public function delete(int $id):  {{model}}|string
    {
        $record = $this->model->find($id);
          if (!$record) {
            return __('Record not found.');
        }

        $record->delete();
        return $record;
    }
}`


};

/* ---------------- UI HELPERS ---------------- */
function toggleStubPreview(show) {
    document.getElementById('stubPreviewScreen').classList.toggle('show', show);
}

function closeModal() {
    if (vscode) vscode.postMessage({ command: 'close' });
}

/* ---------------- STUB RENDERER ---------------- */
function renderStub(type) {
    const model = document.getElementById('modelName').value.trim();
    if (!model) {
        return showToast("Model name is required", "error");
    }

    const fields = [];
    const filtersFields = [];
    const rules = [];
    const fillable = [];

    document.querySelectorAll('.field-row').forEach(row => {
        const name = row.querySelector('.field-name').value.trim();
        const type = row.querySelector('.field-type').value;
        const nullable = row.querySelector('.field-nullable').checked;

        if (!name) return;
        fields.push(name);
        filtersFields.push({ name, type });
        fillable.push(`'${name}'`);
        rules.push(`'${name}' => '${nullable ? 'nullable' : 'required'}'`);
    });

    let stub = stubTemplates[type] || '// Stub not found';
    stub = stub.replace(/{{model}}/g, model);
    stub = stub.replace(/{{camelModel}}/g, toCamel(model));
    stub = stub.replace(/{{snakeModel}}/g, toSnake(model));
    stub = stub.replace(/{{camelModelWithDollar}}/g, "$" + toCamel(model));
    stub = stub.replace(/{{table}}/g, pluralize(model).toLowerCase());

    stub = stub.replace(/{{fillable}}/g, fillable.join(', '));
    stub = stub.replace(/{{fields}}/g, fields.map(f => `$table->string('${f}');`).join('\n    '));
    stub = stub.replace(/{{rules}}/g, rules.join(',\n            '));
    stub = stub.replace(/{{filters}}/g, buildFilters(filtersFields));

    document.getElementById('previewOutput').textContent = stub;
}

/* ---------------- FIELDS ---------------- */
function addFieldRow(field = {}) {
    const container = document.getElementById('fieldsContainer');
    const div = document.createElement('div');
    div.className = "field-row flex flex-wrap gap-3 items-center bg-gray-800 p-4 rounded-md border border-gray-700";

    div.innerHTML = `
        <span class="cursor-move text-gray-400 hover:text-gray-200">
            <i class="fas fa-bars"></i>
        </span>
    
        <input placeholder="name" class="field-name px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white w-36" value="${field.name || ''}" />
        
        <select class="field-type px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white w-32">
          ${fieldTypes.map(t => `<option value="${t}" ${t === field.type ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
        
        <input placeholder="default" class="field-default px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white w-32" value="${field.default || ''}" />
        
        <input placeholder="enum1,enum2" class="field-enum-values px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white w-48 ${field.type === 'enum' ? '' : 'hidden'}" value="${field.enum?.join(',') || ''}" />

        <label class="inline-flex items-center space-x-2 cursor-pointer text-sm text-gray-200">
            <input type="checkbox" 
                    class="field-nullable form-checkbox h-4 w-4 text-blue-500 border-gray-400 rounded focus:ring-0" 
                    ${field.nullable ? 'checked' : ''} />
            <span>Nullable</span>
        </label>

        <button onclick="this.parentElement.remove(); updateCodePreview();" class="text-red-400 text-xl font-bold"><i class="fas fa-times"></i>
        </button>
      `;

    const typeSelect = div.querySelector('.field-type');
    const enumInput = div.querySelector('.field-enum-values');
    typeSelect.addEventListener('change', () => {
        enumInput.classList.toggle('hidden', typeSelect.value !== 'enum');
        updateCodePreview();
    });

    div.querySelectorAll('input, select').forEach(el => el.addEventListener('input', updateCodePreview));
    container.appendChild(div);
    updateCodePreview();
}

function updateCodePreview() {
    const model = document.getElementById('modelName').value.trim();
    const rows = document.querySelectorAll('.field-row');
    const plural = pluralize(model || '');
    let code = `Schema::create('${plural.toLowerCase()}', function (Blueprint $table) {\n  $table->id();\n`;

    rows.forEach(row => {
        const name = row.querySelector('.field-name').value.trim();
        const type = row.querySelector('.field-type').value;
        const nullable = row.querySelector('.field-nullable').checked;
        const defaultVal = row.querySelector('.field-default').value;
        const enumInput = row.querySelector('.field-enum-values');
        const enums = (type === 'enum' && enumInput) ? enumInput.value.split(',').map(e => `'${e.trim()}'`).join(', ') : null;

        if (!name) return;

        code += `  $table->${type === 'enum' ? `enum('${name}', [${enums}])` : `${type}('${name}')`}`;
        if (nullable) code += '->nullable()';
        if (defaultVal) code += `->default('${defaultVal}')`;
        code += ';\n';
    });

    code += '  $table->timestamps();\n});';
    document.getElementById('codePreview').innerText = code;
}

function payloadWithModelandField() {
    const modelInput = document.getElementById('modelName');
    const model = modelInput.value.trim();

    document.querySelectorAll('.error-message').forEach(el => el.remove());
    modelInput.classList.remove('border-red-500');

    let hasError = false;
    if (!model) {
        modelInput.classList.add('border-red-500');
        const error = document.createElement('div');
        error.className = 'error-message text-red-500 text-sm mt-1';
        error.textContent = 'Model name is required.';
        modelInput.parentNode.appendChild(error);
        hasError = true;
    }

    const fields = [];
    document.querySelectorAll('.field-row').forEach(row => {
        const name = row.querySelector('.field-name').value.trim();
        const type = row.querySelector('.field-type').value;
        const nullable = row.querySelector('.field-nullable').checked;
        const defaultVal = row.querySelector('.field-default').value.trim();
        const enumInput = row.querySelector('.field-enum-values');
        const enums = enumInput && !enumInput.classList.contains('hidden')
            ? enumInput.value.split(',').map(e => e.trim())
            : null;

        if (name) fields.push({ name, type, nullable, default: defaultVal || null, enum: enums });
    });

    if (hasError) return;
    const payload = { model, fields };
    return payload;

}
/* ---------------- FORM SUBMIT ---------------- */
function submitData() {

    const payload = payloadWithModelandField();
    addModuleToPostmanCollection(payload.model, payload.fields);
    console.log('Submitting:', payload);
    if (vscode) {
        vscode.postMessage({ command: 'generate', payload });
    }

}

function createLaravelProjectModal() {
    document.getElementById("createLaravelProjectModal").classList.remove("hidden");
}

function closeLaravelProjectModal() {
    document.getElementById("createLaravelProjectModal").classList.add("hidden");
    const input = document.getElementById("newProjectName");
    input.value = "";
}

function createLaravelProject() {
    const input = document.getElementById("newProjectName");
    const title = input.value.trim();
    if (!title) {
        showToast(`Project name is required.`, "error");
    };
    const payload = payloadWithModelandField();
    payload.title = title;
    closeLaravelProjectModal();
    vscode.postMessage({ command: 'laravelCreate', payload });
}

// Listen for extension response
window.addEventListener('message', event => {
    const message = event.data;

    if (message.command === 'generateResult') {
        if (message.success) {
            showToast(`CRUD for "${message.data?.moduleName}" generated successfully`, "success");
            const modelInput = document.getElementById('modelName');
            modelInput.value = '';
            document.querySelectorAll('.field-row').forEach(row => row.remove()); // sab fields clear
            addFieldRow();
        } else {
            if (message.error == "laravelSetUp") {
                createLaravelProjectModal()
                // showToast(`${message.error}`, "error");
            }
        }
    }
})

/* ---------------- TEMPLATES SAVE/LOAD ---------------- */
function saveTemplate() {
    const model = document.getElementById('modelName').value;
    const fields = [];
    document.querySelectorAll('.field-row').forEach(row => {
        fields.push({
            name: row.querySelector('.field-name').value,
            type: row.querySelector('.field-type').value,
            nullable: row.querySelector('.field-nullable').checked,
            default: row.querySelector('.field-default').value,
            enum: row.querySelector('.field-enum-values').value.split(',').map(e => e.trim())
        });
    });
    localStorage.setItem('easystructor_template', JSON.stringify({ model, fields }));
}

function loadTemplate() {
    const raw = localStorage.getItem('easystructor_template');
    if (!raw) return;
    const { model, fields } = JSON.parse(raw);
    document.getElementById('modelName').value = model;
    document.getElementById('fieldsContainer').innerHTML = '';
    fields.forEach(field => addFieldRow(field));
}

/* ---------------- INIT ---------------- */
document.getElementById('darkToggle').addEventListener('change', e => {
    document.documentElement.classList.toggle('dark', e.target.checked);
});

new Sortable(fieldsContainer, { animation: 150, onEnd: updateCodePreview });

window.onload = () => addFieldRow();

