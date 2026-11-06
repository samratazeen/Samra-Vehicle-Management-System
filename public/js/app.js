const $ = (id) => document.getElementById(id);
const state = { customers: [], vehicles: [], services: [], payments: [], editing: null, page: 'dashboard' };
const configs = {
  customers: {
    title: 'Add customer', id: 'customer_id',
    fields: [
      ['name','Customer name','text',true],['phone','Phone number','tel',true],
      ['email','Email address','email',false],['address','Address','textarea',false]
    ]
  },
  vehicles: {
    title: 'Register vehicle', id: 'vehicle_id',
    fields: [
      ['customer_id','Customer','select',true,'customers'],['vehicle_number','Vehicle number','text',true],
      ['vehicle_model','Vehicle model','text',true],['vehicle_type','Vehicle type','select',false,['Car','Bike','Scooter','SUV','Van','Truck','Other']]
    ]
  },
  services: {
    title: 'Create service request', id: 'service_id',
    fields: [
      ['vehicle_id','Customer vehicle','select',true,'vehicles'],['service_type','Service type','select',true,['General service','Oil change','Engine repair','Brake service','Tyre replacement','Washing & detailing','Electrical repair','Other']],
      ['service_date','Appointment date','date',true],['service_charge','Service charge (₹)','number',true],
      ['status','Service progress','select',true,['Requested','In Progress','Completed']],
      ['description','Problem / service description','textarea',false]
    ]
  },
  payments: {
    title: 'Record payment', id: 'payment_id',
    fields: [
      ['service_id','Service record','select',true,'services'],['amount','Amount (₹)','number',true],
      ['payment_date','Payment date','date',true],['payment_method','Payment method','select',true,['Cash','UPI','Card','Bank transfer']],
      ['status','Payment status','select',true,['Pending','Paid','Failed']]
    ]
  }
};
const labels = {customers:'Customers',vehicles:'Vehicles',services:'Service records',payments:'Payments'};
const today = new Date().toISOString().slice(0,10);
$('today').textContent = new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'});

async function api(path, options={}) {
  const response = await fetch(`/api/${path}`, {
    ...options, headers: {'Content-Type':'application/json', ...(options.headers||{})}
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}
function toast(message) {
  $('toast').textContent = message; $('toast').classList.add('show');
  setTimeout(()=>$('toast').classList.remove('show'),2600);
}
function money(value) { return '₹' + Number(value || 0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function safe(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function statusTag(value) {
  const cls = String(value || '').toLowerCase().replace(/\s+/g,'-');
  return `<span class="status ${cls}">${safe(value)}</span>`;
}
async function loadAll() {
  try {
    for (const key of Object.keys(labels)) state[key] = await api(key);
    renderAll();
  } catch (err) { toast(err.message); }
}
function renderAll() {
  renderCustomers(); renderVehicles(); renderServices(); renderPayments(); renderDashboard();
}
function actionButtons(type,id) {
  return `<div class="row-actions"><button class="icon-btn" title="Edit" data-edit="${type}" data-id="${id}"><i class="bi bi-pencil"></i></button><button class="icon-btn delete" title="Delete" data-delete="${type}" data-id="${id}"><i class="bi bi-trash3"></i></button></div>`;
}
function renderCustomers(list=state.customers) {
  $('customerRows').innerHTML = list.length ? list.map(r=>`<tr><td>#${r.customer_id}</td><td><strong>${safe(r.name)}</strong></td><td>${safe(r.phone)}</td><td>${safe(r.email || '—')}</td><td>${safe(r.address || '—')}</td><td>${actionButtons('customers',r.customer_id)}</td></tr>`).join('') : '<tr><td colspan="6" class="empty">No customers yet. Add your first customer.</td></tr>';
}
function renderVehicles(list=state.vehicles) {
  $('vehicleRows').innerHTML = list.length ? list.map(r=>`<tr><td>#${r.vehicle_id}</td><td><strong>${safe(r.vehicle_number)}</strong></td><td>${safe(r.vehicle_model)}</td><td>${safe(r.vehicle_type || '—')}</td><td>${safe(r.customer_name)}</td><td>${actionButtons('vehicles',r.vehicle_id)}</td></tr>`).join('') : '<tr><td colspan="6" class="empty">No vehicles registered yet.</td></tr>';
}
function renderServices(list=state.services) {
  $('serviceRows').innerHTML = list.length ? list.map(r=>`<tr><td>#${r.service_id}</td><td><strong>${safe(r.customer_name)}</strong><br><small>${safe(r.vehicle_number)}</small></td><td>${safe(r.service_type)}</td><td>${safe(r.service_date)}</td><td>${money(r.service_charge)}</td><td>${statusTag(r.status)}</td><td>${actionButtons('services',r.service_id)}</td></tr>`).join('') : '<tr><td colspan="7" class="empty">No service requests yet. Create a booking.</td></tr>';
}
function renderPayments(list=state.payments) {
  $('paymentRows').innerHTML = list.length ? list.map(r=>`<tr><td>#${r.payment_id}</td><td><strong>${safe(r.customer_name)}</strong></td><td>${safe(r.service_type)} · ${safe(r.vehicle_number)}</td><td>${money(r.amount)}</td><td>${safe(r.payment_date)}</td><td>${safe(r.payment_method)}</td><td>${statusTag(r.status)}</td><td>${actionButtons('payments',r.payment_id)}</td></tr>`).join('') : '<tr><td colspan="8" class="empty">No payment records yet.</td></tr>';
}
async function renderDashboard() {
  try {
    const d = await api('dashboard');
    $('statCustomers').textContent = d.customers;
    $('statVehicles').textContent = d.vehicles;
    $('statServices').textContent = d.services;
    $('statRevenue').textContent = money(d.revenue);
    $('recentRows').innerHTML = d.recent.length ? d.recent.map(r=>`<tr><td><strong>${safe(r.customer_name)}</strong></td><td>${safe(r.vehicle_number)}</td><td>${safe(r.service_type)}</td><td>${safe(r.service_date)}</td><td>${statusTag(r.status)}</td></tr>`).join('') : '<tr><td colspan="5" class="empty">Your latest service activity will appear here.</td></tr>';
  } catch(err) { $('recentRows').innerHTML = `<tr><td colspan="5" class="empty">${safe(err.message)}</td></tr>`; }
}
function navigate(page) {
  state.page = page;
  document.querySelectorAll('.page').forEach(el=>el.classList.remove('active'));
  $(`${page}Page`).classList.add('active');
  document.querySelectorAll('.nav-link').forEach(el=>el.classList.toggle('active',el.dataset.page===page));
  $('crumb').textContent = labels[page] || 'Dashboard';
  $('pageTitle').innerHTML = page==='dashboard' ? 'Good to see you, Samra <span>✦</span>' : labels[page];
  $('pageSubtitle').textContent = page==='dashboard' ? 'Here’s what’s happening at your service center today.' : `Manage your ${labels[page].toLowerCase()} with ease.`;
  $('sidebar').classList.remove('open');
}
document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.page)));
document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.goto)));
$('menuToggle').addEventListener('click',()=>$('sidebar').classList.toggle('open'));

function optionList(field) {
  const source = field[4];
  let rows = [];
  if (source==='customers') rows = state.customers.map(x=>[x.customer_id,`${x.name} · ${x.phone}`]);
  else if (source==='vehicles') rows = state.vehicles.map(x=>[x.vehicle_id,`${x.vehicle_number} · ${x.vehicle_model} (${x.customer_name})`]);
  else if (source==='services') rows = state.services.map(x=>[x.service_id,`#${x.service_id} · ${x.service_type} · ${x.vehicle_number}`]);
  else if (Array.isArray(source)) rows = source.map(x=>[x,x]);
  return rows.map(([v,t])=>`<option value="${safe(v)}">${safe(t)}</option>`).join('');
}
function openForm(type, record=null) {
  state.editing = {type, id: record ? record[configs[type].id] : null};
  $('modalTitle').textContent = record ? `Edit ${labels[type].replace(/s$/,'').toLowerCase()}` : configs[type].title;
  $('formFields').innerHTML = configs[type].fields.map(f=>{
    const [name,label,kind,required] = f; const value = record?.[name] ?? (name==='service_date'||name==='payment_date' ? today : '');
    let input = '';
    if (kind==='select') input = `<select name="${name}" ${required?'required':''}><option value="">Choose ${label.toLowerCase()}</option>${optionList(f)}</select>`;
    else if (kind==='textarea') input = `<textarea name="${name}" placeholder="${label}">${safe(value)}</textarea>`;
    else input = `<input name="${name}" type="${kind}" value="${safe(value)}" ${required?'required':''} ${kind==='number'?'min="0" step="0.01"':''} placeholder="${label}">`;
    return `<div class="field ${kind==='textarea'?'full':''}"><label>${label}${required?' *':''}</label>${input}</div>`;
  }).join('');
  if (record) {
    for (const f of configs[type].fields) {
      const el = $('recordForm').elements[f[0]];
      if (el && record[f[0]] != null) el.value = String(record[f[0]]).slice(0,10);
    }
  }
  $('modalBackdrop').classList.add('show');
}
function closeForm() { $('modalBackdrop').classList.remove('show'); $('recordForm').reset(); state.editing=null; }
$('closeModal').addEventListener('click',closeForm); $('cancelModal').addEventListener('click',closeForm);
$('modalBackdrop').addEventListener('click',e=>{if(e.target===$('modalBackdrop'))closeForm();});
$('addCustomer').addEventListener('click',()=>openForm('customers'));
$('addVehicle').addEventListener('click',()=>openForm('vehicles'));
$('addService').addEventListener('click',()=>openForm('services'));
$('addPayment').addEventListener('click',()=>openForm('payments'));

$('recordForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const {type,id}=state.editing;
  const payload=Object.fromEntries(new FormData(e.target).entries());
  for (const k of ['customer_id','vehicle_id','service_id','service_charge','amount']) if(payload[k]!==undefined && payload[k]!=='') payload[k]=Number(payload[k]);
  try {
    await api(id ? `${type}/${id}` : type,{method:id?'PUT':'POST',body:JSON.stringify(payload)});
    closeForm(); await loadAll(); toast(id?'Record updated successfully.':'Record added successfully.');
  } catch(err) { toast(err.message); }
});

document.addEventListener('click',async e=>{
  const edit=e.target.closest('[data-edit]');
  const del=e.target.closest('[data-delete]');
  if(edit) {
    const type=edit.dataset.edit, id=Number(edit.dataset.id);
    const row=state[type].find(x=>x[configs[type].id]===id);
    if(row) openForm(type,row);
  }
  if(del) {
    const type=del.dataset.delete,id=del.dataset.id;
    if(!confirm('Delete this record? This cannot be undone.')) return;
    try { await api(`${type}/${id}`,{method:'DELETE'}); await loadAll(); toast('Record deleted successfully.'); }
    catch(err){toast(err.message);}
  }
});
$('customerSearch').addEventListener('input',e=>renderCustomers(state.customers.filter(x=>`${x.name} ${x.phone} ${x.email||''}`.toLowerCase().includes(e.target.value.toLowerCase()))));
$('vehicleSearch').addEventListener('input',e=>renderVehicles(state.vehicles.filter(x=>`${x.vehicle_number} ${x.vehicle_model} ${x.customer_name}`.toLowerCase().includes(e.target.value.toLowerCase()))));
$('serviceSearch').addEventListener('input',e=>renderServices(state.services.filter(x=>`${x.service_type} ${x.vehicle_number} ${x.customer_name} ${x.status}`.toLowerCase().includes(e.target.value.toLowerCase()))));
$('paymentSearch').addEventListener('input',e=>renderPayments(state.payments.filter(x=>`${x.customer_name} ${x.service_type} ${x.payment_method} ${x.status}`.toLowerCase().includes(e.target.value.toLowerCase()))));

loadAll();
