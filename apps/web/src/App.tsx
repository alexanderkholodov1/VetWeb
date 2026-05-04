import { useState, type FormEvent, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Route, Routes, Link, NavLink, useLocation, Navigate } from "react-router-dom";
import { CalendarDays, HeartHandshake, PawPrint, ShieldCheck, Stethoscope, Syringe } from "lucide-react";
import { api } from "./api";
import { useAuth } from "./auth";

function roleLabel(role?: string | null) {
  const labels: Record<string, string> = {
    CITIZEN: "Ciudadano",
    OWNER: "Dueño",
    VOLUNTEER: "Voluntario",
    DONOR: "Donante",
    VETERINARIAN: "Veterinario",
    ADMIN: "Administrador"
  };
  return role ? labels[role] ?? role : "Sin sesión";
}

function prettifyEnum(value?: string | null) {
  if (!value) return "Sin dato";
  return value
    .toLowerCase()
    .split("_")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString("es-EC") : "Sin fecha";
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("es-EC") : "Sin fecha";
}

function formatCurrency(value: number | string) {
  const amount = typeof value === "number" ? value : Number(value);
  return new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(amount || 0);
}

type Campaign = { id: string; title: string; description: string; location: string; startsAt: string; endsAt: string; registrations?: Array<unknown> };
type Veterinarian = { id: string; specialty: string; biography?: string; schedule?: string; user: { fullName: string; sector?: string; avatarUrl?: string } };
type Pet = { id: string; name: string; species: string; breed?: string; age?: number };
type AdminPet = {
  id: string;
  name: string;
  species: string;
  breed?: string;
  age?: number;
  notes?: string;
  owner: { id: string; fullName: string; email: string; phone?: string; sector?: string };
  appointments: Array<{ id: string; scheduledAt: string; reason: string; status: string; notes?: string; veterinarianId?: string | null }>;
  medicalRecords: Array<{ id: string; diagnosis: string; treatment: string; createdAt: string; veterinarian: { fullName: string; email: string } }>;
};
type UserRow = { id: string; fullName: string; email: string; role: string; sector?: string };
type AppointmentRow = { id: string; scheduledAt: string; reason: string; status: string; notes?: string; veterinarianId?: string | null; pet: { id: string; name: string; species: string }; owner: { fullName: string; email?: string } };
type DonationRow = { id: string; amount: number | string; kind: string; message?: string; createdAt: string; donor: { fullName: string } };
type ReportRow = { id: string; description: string; status: string; latitude: number; longitude: number; createdAt: string; reporter: { fullName: string; role: string } };

export function App() {
  const auth = useAuth();
  const location = useLocation();
  const isAdminExperience = auth.user?.role === "ADMIN" && location.pathname.startsWith("/admin");

  return (
    <div className={`app-shell ${isAdminExperience ? "admin-shell" : ""}`}>
      <Header />
      <main className={isAdminExperience ? "admin-main" : undefined}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/eventos" element={<EventsPage />} />
          <Route path="/veterinarios" element={<VeterinariansPage />} />
          <Route path="/citas" element={<AppointmentsPage />} />
          <Route path="/reportes" element={<ReportsPage />} />
          <Route path="/donaciones" element={<DonationsPage />} />
          <Route path="/apadrinamiento" element={<SponsorshipPage />} />
          <Route path="/portal" element={<ProtectedPage allowed={["OWNER", "ADMIN"]}><PortalPage /></ProtectedPage>} />
          <Route path="/staff" element={<ProtectedPage allowed={["VETERINARIAN", "VOLUNTEER", "ADMIN"]}><StaffPage /></ProtectedPage>} />
          <Route path="/admin" element={<ProtectedPage allowed={["ADMIN"]}><AdminPage /></ProtectedPage>} />
          <Route path="*" element={<Navigate to={location.pathname === "/" ? "/" : "/"} replace />} />
        </Routes>
      </main>
      {!isAdminExperience && <Footer />}
      {auth.open && <AuthModal />}
    </div>
  );
}

function Header() {
  const { user } = useAuth();
  const location = useLocation();
  if (user?.role === "ADMIN" && location.pathname.startsWith("/admin")) {
    return <AdminHeader />;
  }

  return <PublicHeader />;
}

function PublicHeader() {
  const { user, setOpen, logout } = useAuth();
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="logo-link">
          <img src="/assets/logo.svg" alt="Logo Por un Amigo Fiel" />
          <span>Por un Amigo Fiel</span>
        </Link>
        <nav className="main-nav">
          <NavLink to="/">Inicio</NavLink>
          <NavLink to="/eventos">Eventos</NavLink>
          <NavLink to="/veterinarios">Veterinarios</NavLink>
          <NavLink to="/citas">Agendar cita</NavLink>
          <NavLink to="/reportes">Reportar caso</NavLink>
          <NavLink to="/donaciones">Donar</NavLink>
        </nav>
        <div className="header-actions">
          <span className={`session-badge ${user ? "online" : ""}`}>{user ? `${user.email} · ${roleLabel(user.role)}` : "Sin sesión"}</span>
          <Link className="btn btn-ghost btn-sm" to={user?.role === "ADMIN" ? "/admin" : user?.role === "VETERINARIAN" || user?.role === "VOLUNTEER" ? "/staff" : "/portal"}>Portal</Link>
          {user ? <button className="btn btn-primary btn-sm" onClick={logout}>Cerrar sesión</button> : <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>Ingresar</button>}
        </div>
      </div>
    </header>
  );
}

function AdminHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="admin-header">
      <div className="admin-header-inner">
        <Link to="/admin" className="admin-brand">
          <img src="/assets/logo.svg" alt="Logo Por un Amigo Fiel" />
          <div>
            <strong>Centro de administración</strong>
            <span>Operación, control y seguimiento institucional</span>
          </div>
        </Link>
        <nav className="admin-nav">
          <a href="#resumen">Resumen</a>
          <a href="#usuarios">Usuarios</a>
          <a href="#citas">Citas</a>
          <a href="#mascotas">Mascotas</a>
          <a href="#reportes">Reportes</a>
          <a href="#donaciones">Donaciones</a>
          <a href="#inventario">Inventario</a>
        </nav>
        <div className="admin-actions">
          <span className="session-badge online">{user ? `${user.email} · ${roleLabel(user.role)}` : "Admin"}</span>
          <Link className="btn btn-ghost btn-sm" to="/">Ver sitio público</Link>
          <button className="btn btn-primary btn-sm" onClick={logout}>Cerrar sesión</button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <div className="footer-brand"><img src="/assets/logo.svg" alt="" />Por un Amigo Fiel</div>
          <p>Plataforma comunitaria para el bienestar animal en Píllaro, ahora sobre React, NestJS y PostgreSQL.</p>
        </div>
        <div><h4>Plataforma</h4><Link to="/eventos">Eventos</Link><Link to="/citas">Agendar cita</Link><Link to="/reportes">Reportar caso</Link><Link to="/donaciones">Donar</Link></div>
        <div><h4>Portales</h4><Link to="/portal">Portal cliente</Link><Link to="/staff">Portal staff</Link><Link to="/admin">Panel admin</Link></div>
        <div><h4>Contacto</h4><a href="https://www.facebook.com/porunamigofielpillaro/?locale=es_LA" target="_blank" rel="noreferrer">Facebook</a><a href="mailto:hola@porunamigofiel.ec">hola@porunamigofiel.ec</a></div>
      </div>
      <div className="site-footer-bottom"><span>© 2026 Por un Amigo Fiel · Píllaro</span><span>Reescritura full stack</span></div>
    </footer>
  );
}

function HomePage() {
  const campaigns = useQuery({ queryKey: ["campaigns"], queryFn: api.campaigns });
  const veterinarians = useQuery({ queryKey: ["veterinarians"], queryFn: api.veterinarians });

  return (
    <>
      <section className="hero container">
        <div className="hero-grid">
          <div>
            <span className="kicker">Píllaro · Tungurahua</span>
            <h1>Una red ciudadana <em>por cada amigo fiel</em>.</h1>
            <p className="hero-text">Reporta abandono, agenda citas, dona, apadrina y coordina campañas desde una plataforma mantenible y preparada para operar en serio.</p>
            <div className="hero-actions">
              <Link to="/reportes" className="btn btn-primary btn-lg">Reportar abandono</Link>
              <Link to="/citas" className="btn btn-ghost btn-lg">Agendar cita</Link>
            </div>
            <div className="hero-meta">
              <div><strong>+850</strong><span>animales atendidos</span></div>
              <div><strong>120</strong><span>familias adoptantes</span></div>
              <div><strong>{campaigns.data?.length ?? 0}</strong><span>campañas activas</span></div>
            </div>
          </div>
          <div className="hero-visual">
            <img src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1000&auto=format&fit=crop&q=70" alt="Perro rescatado" />
            <div className="badge-floating badge-top"><span className="dot">🐾</span><div><small>Próxima jornada</small><strong>{campaigns.data?.[0]?.title ?? "Campaña comunitaria"}</strong></div></div>
            <div className="badge-floating badge-bot"><span className="dot">❤</span><div><small>Equipo disponible</small><strong>{veterinarians.data?.length ?? 0} veterinarios</strong></div></div>
          </div>
        </div>
      </section>

      <section className="container section-tight">
        <div className="stats">
          <div className="stat"><strong>Docker</strong><span>entorno reproducible</span></div>
          <div className="stat"><strong>NestJS</strong><span>API modular y tipada</span></div>
          <div className="stat"><strong>PostgreSQL</strong><span>modelo relacional serio</span></div>
          <div className="stat"><strong>React</strong><span>UI mantenible por módulos</span></div>
        </div>
      </section>

      <section className="container">
        <div className="section-head">
          <span className="eyebrow">Lo que puedes hacer</span>
          <h2>Todo el alcance actual, ahora sobre una base más sólida</h2>
        </div>
        <div className="grid-4">
          <FeatureCard icon={<Stethoscope size={26} />} title="Atención veterinaria" text="Mascotas, citas, agenda e historial médico." to="/citas" />
          <FeatureCard icon={<Syringe size={26} />} title="Rescate y reportes" text="Casos con ubicación, prioridad y trazabilidad." to="/reportes" tone="rose" />
          <FeatureCard icon={<HeartHandshake size={26} />} title="Donaciones" text="Aportes puntuales y apoyo recurrente." to="/donaciones" tone="amber" />
          <FeatureCard icon={<CalendarDays size={26} />} title="Comunidad" text="Campañas, jornadas e inscripciones." to="/eventos" tone="teal" />
        </div>
      </section>

      <section className="container">
        <div className="between">
          <div>
            <span className="eyebrow">Calendario activo</span>
            <h2>Campañas y eventos próximos</h2>
          </div>
          <Link to="/eventos" className="btn btn-ghost btn-sm">Ver todos</Link>
        </div>
        <div className="campaign-list section-gap-top">
          {campaigns.data?.map((campaign) => (
            <article key={campaign.id} className="campaign-row">
              <div className="date-box">{new Date(campaign.startsAt).getDate()}<small>{new Date(campaign.startsAt).toLocaleDateString("es-EC", { month: "short" }).toUpperCase()}</small></div>
              <div>
                <strong>{campaign.title}</strong>
                <span>{campaign.location} · {campaign.description}</span>
              </div>
              <span className="pill">{campaign.registrations?.length ?? 0} inscritos</span>
            </article>
          ))}
        </div>
      </section>

      <section className="container">
        <div className="section-head">
          <span className="eyebrow">Equipo profesional</span>
          <h2>Veterinarios y voluntarios al servicio de Píllaro</h2>
        </div>
        <div className="grid-3">
          {veterinarians.data?.map((vet) => (
            <article className="profile-card" key={vet.id}>
              <img className="profile-photo" src={vet.user.avatarUrl || "https://i.pravatar.cc/640?img=12"} alt={vet.user.fullName} />
              <span className="tag">{vet.specialty}</span>
              <h3>{vet.user.fullName}</h3>
              <p className="muted">{vet.schedule || "Agenda disponible bajo coordinación"}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function FeatureCard({ icon, title, text, to, tone }: { icon: ReactNode; title: string; text: string; to: string; tone?: string }) {
  return <article className={`card-feature ${tone ? `tone-${tone}` : ""}`}><div className="card-icon">{icon}</div><h3>{title}</h3><p>{text}</p><Link className="read-more" to={to}>Abrir módulo</Link></article>;
}

function EventsPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const campaigns = useQuery({ queryKey: ["campaigns"], queryFn: api.campaigns });

  const register = async (campaignId: string) => {
    if (!auth.token) {
      auth.setOpen(true);
      return;
    }
    await api.registerCampaign(auth.token, campaignId);
    await queryClient.invalidateQueries({ queryKey: ["campaigns"] });
  };

  return <PageLayout kicker="Comunidad activa" title="Próximos eventos y campañas" lead="Participa en jornadas de salud, talleres y campañas comunitarias.">
    <div className="grid-2">
      {campaigns.data?.map((campaign) => <article className="card-feature" key={campaign.id}><span className="tag">{new Date(campaign.startsAt).toLocaleDateString("es-EC")}</span><h3>{campaign.title}</h3><p className="muted">{campaign.location}</p><p>{campaign.description}</p><button className="btn btn-primary btn-sm" onClick={() => void register(campaign.id)}>Inscribirme</button></article>)}
    </div>
  </PageLayout>;
}

function VeterinariansPage() {
  const vets = useQuery({ queryKey: ["veterinarians"], queryFn: api.veterinarians });
  return <PageLayout kicker="Equipo profesional" title="Veterinarios disponibles" lead="Consulta especialidades, sectores y disponibilidad de atención.">
    <div className="grid-3">{vets.data?.map((vet: Veterinarian) => <article className="profile-card" key={vet.id}><img className="profile-photo" src={vet.user.avatarUrl || "https://i.pravatar.cc/640?img=31"} alt={vet.user.fullName} /><span className="tag">{vet.specialty}</span><h3>{vet.user.fullName}</h3><p className="muted">{vet.schedule || "Agenda por confirmar"}</p><p>{vet.biography || "Atención preventiva, campañas y soporte comunitario."}</p></article>)}</div>
  </PageLayout>;
}

function AppointmentsPage() {
  const auth = useAuth();
  const pets = useQuery({ queryKey: ["pets", auth.token], queryFn: () => api.pets(auth.token!), enabled: Boolean(auth.token) });
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm<{ petId: string; scheduledAt: string; reason: string }>();

  const onSubmit = handleSubmit(async (values) => {
    if (!auth.token) return auth.setOpen(true);
    await api.createAppointment(auth.token, values);
    reset();
    await queryClient.invalidateQueries({ queryKey: ["pets", auth.token] });
  });

  return <PageLayout kicker="Veterinaria" title="Agendar cita" lead="Crea citas desde una base relacional consistente y enlazada a tus mascotas.">
    <div className="grid-2">
      <article className="card card-elevated">
        <h3>Nueva cita</h3>
        {!auth.user && <p className="feedback">Inicia sesión como dueño de mascota para reservar una cita.</p>}
        <form className="form-stack" onSubmit={onSubmit}>
          <label>Mascota<select {...register("petId")} required>{pets.data?.map((pet: Pet) => <option key={pet.id} value={pet.id}>{pet.name} · {pet.species}</option>)}</select></label>
          <label>Fecha y hora<input type="datetime-local" {...register("scheduledAt")} required /></label>
          <label>Motivo<textarea rows={4} {...register("reason")} required /></label>
          <button className="btn btn-primary">Guardar cita</button>
        </form>
      </article>
      <article className="card">
        <h3>Tus mascotas</h3>
        <ul className="simple-list">{pets.data?.map((pet: Pet) => <li key={pet.id}><span>{pet.name} · {pet.species}{pet.breed ? ` · ${pet.breed}` : ""}</span></li>)}</ul>
        <Link to="/portal" className="btn btn-soft btn-sm">Administrar mascotas</Link>
      </article>
    </div>
  </PageLayout>;
}

function ReportsPage() {
  const auth = useAuth();
  const { register, handleSubmit, reset } = useForm<{ description: string; photoUrl?: string; latitude: number; longitude: number }>();
  const onSubmit = handleSubmit(async (values) => {
    if (!auth.token) return auth.setOpen(true);
    await api.createReport(auth.token, values);
    reset();
    alert("Reporte enviado");
  });

  return <PageLayout kicker="Rescate ciudadano" title="Reporta un caso de abandono" lead="Describe el caso y comparte la ubicación para acelerar la respuesta del equipo.">
    <div className="grid-2"><article className="card card-elevated"><h3>Detalles del caso</h3><form className="form-stack" onSubmit={onSubmit}><label>Descripción<textarea rows={4} {...register("description")} required /></label><label>URL de foto<input type="url" {...register("photoUrl")} /></label><div className="field-row"><label>Latitud<input type="number" step="any" {...register("latitude", { valueAsNumber: true })} required /></label><label>Longitud<input type="number" step="any" {...register("longitude", { valueAsNumber: true })} required /></label></div><button className="btn btn-primary">Enviar reporte</button></form></article><article className="card"><h3>Antes de enviar</h3><ul className="simple-list"><li><span>No muevas al animal si hay heridas graves.</span></li><li><span>Las fotos ayudan a clasificar gravedad y especie.</span></li><li><span>Usa coordenadas precisas para reducir tiempo de respuesta.</span></li></ul></article></div>
  </PageLayout>;
}

function DonationsPage() {
  const auth = useAuth();
  const { register, handleSubmit, reset } = useForm<{ amount: number; kind: "ONE_TIME" | "MONTHLY"; message?: string }>();
  const onSubmit = handleSubmit(async (values) => {
    if (!auth.token) return auth.setOpen(true);
    await api.donate(auth.token, values);
    reset();
    alert("Donación registrada");
  });

  return <PageLayout kicker="Aporte solidario" title="Donar para sostener rescates y atención" lead="Registra donaciones puntuales o mensuales con trazabilidad administrativa.">
    <div className="grid-2"><article className="card card-elevated"><form className="form-stack" onSubmit={onSubmit}><label>Monto<input type="number" step="0.01" {...register("amount", { valueAsNumber: true })} required /></label><label>Tipo<select {...register("kind")}><option value="ONE_TIME">Única</option><option value="MONTHLY">Mensual</option></select></label><label>Mensaje<textarea rows={4} {...register("message")} /></label><button className="btn btn-primary">Registrar donación</button></form></article><article className="card"><h3>En qué se convierte tu aporte</h3><ul className="simple-list"><li><span>Medicinas y tratamientos.</span></li><li><span>Alimento y recuperación.</span></li><li><span>Campañas de esterilización y prevención.</span></li></ul></article></div>
  </PageLayout>;
}

function SponsorshipPage() {
  const auth = useAuth();
  const { register, handleSubmit, reset } = useForm<{ animalName: string; monthlyFee: number; notes?: string }>();
  const onSubmit = handleSubmit(async (values) => {
    if (!auth.token) return auth.setOpen(true);
    await api.sponsor(auth.token, values);
    reset();
    alert("Apadrinamiento registrado");
  });
  return <PageLayout kicker="Apoyo recurrente" title="Apadrina un caso" lead="Vincula un aporte mensual a un animal rescatado con seguimiento administrativo.">
    <div className="grid-2"><article className="card card-elevated"><form className="form-stack" onSubmit={onSubmit}><label>Nombre del caso<input {...register("animalName")} required /></label><label>Aporte mensual<input type="number" step="0.01" {...register("monthlyFee", { valueAsNumber: true })} required /></label><label>Notas<textarea rows={4} {...register("notes")} /></label><button className="btn btn-primary">Registrar apadrinamiento</button></form></article><article className="card"><h3>Qué obtienes</h3><ul className="simple-list"><li><span>Trazabilidad del apoyo recurrente.</span></li><li><span>Casos mejor organizados para el equipo.</span></li><li><span>Una base más seria para informes y seguimiento.</span></li></ul></article></div>
  </PageLayout>;
}

function PortalPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const pets = useQuery({ queryKey: ["pets", auth.token], queryFn: () => api.pets(auth.token!), enabled: Boolean(auth.token) });
  const { register, handleSubmit, reset } = useForm<{ name: string; species: string; breed?: string; age?: number; notes?: string }>();
  const onSubmit = handleSubmit(async (values) => {
    if (!auth.token) return;
    await api.createPet(auth.token, values);
    reset();
    await queryClient.invalidateQueries({ queryKey: ["pets", auth.token] });
  });

  return <PageLayout kicker="Portal de cliente" title="Gestiona tus mascotas y citas" lead="La experiencia del cliente ahora vive en una aplicación React con estado y rutas consistentes.">
    <div className="grid-2"><article className="card card-elevated"><h3>Registrar mascota</h3><form className="form-stack" onSubmit={onSubmit}><label>Nombre<input {...register("name")} required /></label><div className="field-row"><label>Especie<input {...register("species")} required /></label><label>Raza<input {...register("breed")} /></label></div><div className="field-row"><label>Edad<input type="number" {...register("age", { valueAsNumber: true })} /></label><label>Notas<input {...register("notes")} /></label></div><button className="btn btn-primary">Guardar mascota</button></form></article><article className="card"><h3>Mis mascotas</h3><ul className="simple-list">{pets.data?.map((pet: Pet) => <li key={pet.id}><span>{pet.name} · {pet.species}{pet.age ? ` · ${pet.age} años` : ""}</span></li>)}</ul><div className="row"><Link className="btn btn-soft btn-sm" to="/citas">Agendar cita</Link><Link className="btn btn-soft btn-sm" to="/eventos">Ver campañas</Link></div></article></div>
  </PageLayout>;
}

function StaffPage() {
  const auth = useAuth();
  const agenda = useQuery({ queryKey: ["agenda", auth.token], queryFn: () => api.agenda(auth.token!), enabled: Boolean(auth.token) });
  const reports = useQuery({ queryKey: ["reports", auth.token], queryFn: () => api.reports(auth.token!), enabled: Boolean(auth.token) });
  return <PageLayout kicker="Portal staff" title="Agenda clínica y reportes operativos" lead="Vista operativa para voluntarios, veterinarios y coordinación interna.">
    <div className="grid-2"><article className="card"><h3>Agenda</h3><ul className="simple-list">{agenda.data?.map((item) => <li key={item.id}><span>{new Date(item.scheduledAt).toLocaleString("es-EC")} · {item.pet.name} · {item.owner.fullName}</span></li>)}</ul></article><article className="card"><h3>Reportes recientes</h3><ul className="simple-list">{reports.data?.map((report) => <li key={report.id}><span>{report.description} · {report.status}</span></li>)}</ul></article></div>
  </PageLayout>;
}

function AdminPage() {
  const auth = useAuth();
  const metrics = useQuery({ queryKey: ["metrics", auth.token], queryFn: () => api.metrics(auth.token!), enabled: Boolean(auth.token) });
  const users = useQuery({ queryKey: ["users", auth.token], queryFn: () => api.users(auth.token!), enabled: Boolean(auth.token) });
  const donations = useQuery({ queryKey: ["donations", auth.token], queryFn: () => api.donations(auth.token!), enabled: Boolean(auth.token) });
  const reports = useQuery({ queryKey: ["reports", auth.token], queryFn: () => api.reports(auth.token!), enabled: Boolean(auth.token) });
  const pets = useQuery({ queryKey: ["admin-pets", auth.token], queryFn: () => api.adminPets(auth.token!), enabled: Boolean(auth.token) });
  const agenda = useQuery({ queryKey: ["admin-agenda", auth.token], queryFn: () => api.agenda(auth.token!), enabled: Boolean(auth.token) });
  const veterinarians = useQuery({ queryKey: ["admin-veterinarians"], queryFn: api.veterinarians, enabled: Boolean(auth.token) });
  const supplies = useQuery({ queryKey: ["supplies", auth.token], queryFn: () => api.supplies(auth.token!), enabled: Boolean(auth.token) });
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm<{ name: string; stock: number; unit: string }>();
  const medicalRecordForm = useForm<{ petId: string; veterinarianId: string; diagnosis: string; treatment: string }>();
  const [userSearch, setUserSearch] = useState("");
  const [petSearch, setPetSearch] = useState("");
  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [reportSearch, setReportSearch] = useState("");
  const [donationSearch, setDonationSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedDonationId, setSelectedDonationId] = useState<string | null>(null);

  const userRows = (users.data ?? []) as UserRow[];
  const petRows = (pets.data ?? []) as AdminPet[];
  const appointmentRows = (agenda.data ?? []) as AppointmentRow[];
  const donationRows = (donations.data ?? []) as DonationRow[];
  const reportRows = (reports.data ?? []) as ReportRow[];
  const supplyRows = supplies.data ?? [];
  const veterinarianRows = (veterinarians.data ?? []) as Veterinarian[];

  const filteredUsers = userRows.filter((user) => `${user.fullName} ${user.email} ${user.role} ${user.sector ?? ""}`.toLowerCase().includes(userSearch.toLowerCase()));
  const filteredPets = petRows.filter((pet) => `${pet.name} ${pet.species} ${pet.breed ?? ""} ${pet.owner.fullName} ${pet.owner.email}`.toLowerCase().includes(petSearch.toLowerCase()));
  const filteredAppointments = appointmentRows.filter((appointment) => `${appointment.pet.name} ${appointment.owner.fullName} ${appointment.reason} ${appointment.status}`.toLowerCase().includes(appointmentSearch.toLowerCase()));
  const filteredReports = reportRows.filter((report) => `${report.description} ${report.status} ${report.reporter.fullName}`.toLowerCase().includes(reportSearch.toLowerCase()));
  const filteredDonations = donationRows.filter((donation) => `${donation.donor.fullName} ${donation.kind} ${donation.message ?? ""}`.toLowerCase().includes(donationSearch.toLowerCase()));

  const selectedUser = filteredUsers.find((user) => user.id === selectedUserId) ?? filteredUsers[0];
  const selectedPet = filteredPets.find((pet) => pet.id === selectedPetId) ?? filteredPets[0];
  const selectedAppointment = filteredAppointments.find((appointment) => appointment.id === selectedAppointmentId) ?? filteredAppointments[0];
  const selectedReport = filteredReports.find((report) => report.id === selectedReportId) ?? filteredReports[0];
  const selectedDonation = filteredDonations.find((donation) => donation.id === selectedDonationId) ?? filteredDonations[0];

  const selectedUserPets = selectedUser ? petRows.filter((pet) => pet.owner.id === selectedUser.id) : [];
  const pendingAppointments = appointmentRows.filter((appointment) => appointment.status === "REQUESTED");
  const completedAppointments = appointmentRows.filter((appointment) => appointment.status === "COMPLETED");
  const unresolvedReports = reportRows.filter((report) => report.status !== "RESOLVED");
  const petsWithoutMedicalRecord = petRows.filter((pet) => pet.medicalRecords.length === 0);
  const totalDonationAmount = donationRows.reduce((sum, donation) => sum + Number(donation.amount), 0);
  const lowStockItems = supplyRows.filter((supply) => supply.stock <= 10);

  const onSubmit = handleSubmit(async (values) => {
    if (!auth.token) return;
    await api.upsertSupply(auth.token, values);
    reset();
    await queryClient.invalidateQueries({ queryKey: ["supplies", auth.token] });
  });

  const onMedicalRecordSubmit = medicalRecordForm.handleSubmit(async (values) => {
    if (!auth.token) return;
    await api.createMedicalRecord(auth.token, values);
    medicalRecordForm.reset();
    await queryClient.invalidateQueries({ queryKey: ["admin-pets", auth.token] });
  });

  const updateRole = async (userId: string, role: string) => {
    if (!auth.token) return;
    await api.updateUserRole(auth.token, userId, role);
    await queryClient.invalidateQueries({ queryKey: ["users", auth.token] });
  };

  const updateAppointment = async (appointmentId: string, status: string) => {
    if (!auth.token) return;
    await api.updateAppointment(auth.token, appointmentId, { status });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-agenda", auth.token] }),
      queryClient.invalidateQueries({ queryKey: ["admin-pets", auth.token] })
    ]);
  };

  const saveAppointmentDetails = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth.token || !selectedAppointment) return;

    const form = new FormData(event.currentTarget);
    const veterinarianId = String(form.get("veterinarianId") ?? "").trim();
    const notes = String(form.get("notes") ?? "").trim();
    const status = String(form.get("status") ?? selectedAppointment.status);

    await api.updateAppointment(auth.token, selectedAppointment.id, {
      status,
      notes,
      veterinarianId: veterinarianId || null
    });

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-agenda", auth.token] }),
      queryClient.invalidateQueries({ queryKey: ["admin-pets", auth.token] })
    ]);
  };

  return <div className="admin-dashboard">
    <section className="admin-hero" id="resumen">
      <div>
        <span className="kicker">Centro de control</span>
        <h1>Administración operativa</h1>
        <p className="lead">Vista administrativa dedicada para supervisar personas, agenda clínica, reportes, donaciones, historial médico e inventario sin mezclar navegación pública.</p>
      </div>
      <div className="admin-summary-strip">
        <div className="summary-chip"><strong>{pendingAppointments.length}</strong><span>citas por confirmar</span></div>
        <div className="summary-chip"><strong>{unresolvedReports.length}</strong><span>reportes abiertos</span></div>
        <div className="summary-chip"><strong>{petsWithoutMedicalRecord.length}</strong><span>mascotas sin ficha</span></div>
        <div className="summary-chip"><strong>{formatCurrency(totalDonationAmount)}</strong><span>donación acumulada</span></div>
      </div>
    </section>

    <section className="admin-section">
      <article className="card">
        <div className="metrics-grid">
          <Metric label="Usuarios" value={metrics.data?.users ?? 0} />
          <Metric label="Mascotas" value={metrics.data?.pets ?? 0} />
          <Metric label="Citas" value={metrics.data?.appointments ?? 0} />
          <Metric label="Reportes" value={metrics.data?.reports ?? 0} />
          <Metric label="Donaciones" value={metrics.data?.donations ?? 0} />
          <Metric label="Suministros" value={metrics.data?.supplies ?? 0} />
        </div>
      </article>
    </section>

    <section className="admin-section" id="usuarios">
      <div className="admin-section-head">
        <div><span className="eyebrow">Usuarios</span><h2>Cuentas y perfiles</h2></div>
        <input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Buscar por nombre, correo, rol o sector" />
      </div>
      <div className="admin-master-detail">
        <article className="card admin-list-card">
          <h3>Directorio</h3>
          <ul className="simple-list selectable-list">
            {filteredUsers.map((user) => <li key={user.id} className={selectedUser?.id === user.id ? "selected" : ""}><button type="button" className="list-button" onClick={() => setSelectedUserId(user.id)}><div><strong>{user.fullName}</strong><p className="muted">{user.email}</p></div><span className="pill">{roleLabel(user.role)}</span></button></li>)}
          </ul>
        </article>
        <article className="card detail-card">
          {selectedUser ? <>
            <div className="detail-header"><div><span className="eyebrow">Detalle</span><h3>{selectedUser.fullName}</h3></div><span className="pill">{roleLabel(selectedUser.role)}</span></div>
            <div className="detail-grid">
              <div><small>Correo</small><strong>{selectedUser.email}</strong></div>
              <div><small>Sector</small><strong>{selectedUser.sector || "Sin sector"}</strong></div>
              <div><small>Mascotas</small><strong>{selectedUserPets.length}</strong></div>
              <div><small>Permiso actual</small><strong>{roleLabel(selectedUser.role)}</strong></div>
            </div>
            <label>Actualizar rol<select value={selectedUser.role} onChange={(event) => void updateRole(selectedUser.id, event.target.value)}><option value="CITIZEN">Ciudadano</option><option value="OWNER">Dueño</option><option value="VOLUNTEER">Voluntario</option><option value="DONOR">Donante</option><option value="VETERINARIAN">Veterinario</option><option value="ADMIN">Administrador</option></select></label>
            <h4>Mascotas vinculadas</h4>
            <ul className="simple-list compact-list">{selectedUserPets.length ? selectedUserPets.map((pet) => <li key={pet.id}><span>{pet.name} · {pet.species}{pet.breed ? ` · ${pet.breed}` : ""}</span></li>) : <li><span>Sin mascotas asociadas</span></li>}</ul>
          </> : <p className="feedback">No hay usuarios que coincidan con el filtro actual.</p>}
        </article>
      </div>
    </section>

    <section className="admin-section" id="citas">
      <div className="admin-section-head">
        <div><span className="eyebrow">Agenda clínica</span><h2>Citas y coordinación</h2></div>
        <input value={appointmentSearch} onChange={(event) => setAppointmentSearch(event.target.value)} placeholder="Buscar por mascota, cliente, motivo o estado" />
      </div>
      <div className="admin-master-detail">
        <article className="card admin-list-card">
          <h3>Agenda completa</h3>
          <ul className="simple-list selectable-list">
            {filteredAppointments.map((appointment) => <li key={appointment.id} className={selectedAppointment?.id === appointment.id ? "selected" : ""}><button type="button" className="list-button" onClick={() => setSelectedAppointmentId(appointment.id)}><div><strong>{appointment.pet.name} · {appointment.owner.fullName}</strong><p className="muted">{formatDateTime(appointment.scheduledAt)}</p></div><span className="pill">{prettifyEnum(appointment.status)}</span></button></li>)}
          </ul>
        </article>
        <article className="card detail-card">
          {selectedAppointment ? <>
            <div className="detail-header"><div><span className="eyebrow">Detalle</span><h3>{selectedAppointment.pet.name}</h3></div><span className="pill">{prettifyEnum(selectedAppointment.status)}</span></div>
            <div className="detail-grid">
              <div><small>Cliente</small><strong>{selectedAppointment.owner.fullName}</strong></div>
              <div><small>Fecha</small><strong>{formatDateTime(selectedAppointment.scheduledAt)}</strong></div>
              <div><small>Motivo</small><strong>{selectedAppointment.reason}</strong></div>
              <div><small>Veterinario asignado</small><strong>{selectedAppointment.veterinarianId ? "Asignado" : "Pendiente"}</strong></div>
            </div>
            <div className="row">
              <button className="btn btn-soft btn-sm" onClick={() => void updateAppointment(selectedAppointment.id, "CONFIRMED")}>Confirmar</button>
              <button className="btn btn-soft btn-sm" onClick={() => void updateAppointment(selectedAppointment.id, "COMPLETED")}>Completar</button>
              <button className="btn btn-soft btn-sm" onClick={() => void updateAppointment(selectedAppointment.id, "CANCELED")}>Cancelar</button>
            </div>
            <form key={selectedAppointment.id} className="form-stack section-gap-top" onSubmit={(event) => void saveAppointmentDetails(event)}>
              <label>Estado<select name="status" defaultValue={selectedAppointment.status}><option value="REQUESTED">Solicitada</option><option value="CONFIRMED">Confirmada</option><option value="COMPLETED">Completada</option><option value="CANCELED">Cancelada</option></select></label>
              <label>Veterinario<select name="veterinarianId" defaultValue={selectedAppointment.veterinarianId ?? ""}><option value="">Sin asignar</option>{veterinarianRows.map((vet) => <option key={vet.user.id} value={vet.user.id}>{vet.user.fullName}</option>)}</select></label>
              <label>Notas internas<textarea name="notes" rows={4} defaultValue={selectedAppointment.notes ?? ""} /></label>
              <button className="btn btn-primary">Guardar cambios de la cita</button>
            </form>
            <div className="detail-grid section-gap-top">
              <div><small>Pendientes</small><strong>{pendingAppointments.length}</strong></div>
              <div><small>Completadas</small><strong>{completedAppointments.length}</strong></div>
            </div>
          </> : <p className="feedback">No hay citas que coincidan con el filtro actual.</p>}
        </article>
      </div>
    </section>

    <section className="admin-section" id="mascotas">
      <div className="admin-section-head">
        <div><span className="eyebrow">Mascotas y salud</span><h2>Historial clínico</h2></div>
        <input value={petSearch} onChange={(event) => setPetSearch(event.target.value)} placeholder="Buscar por mascota, especie, dueño o correo" />
      </div>
      <div className="admin-master-detail">
        <article className="card admin-list-card">
          <h3>Base de mascotas</h3>
          <ul className="simple-list selectable-list">
            {filteredPets.map((pet) => <li key={pet.id} className={selectedPet?.id === pet.id ? "selected" : ""}><button type="button" className="list-button" onClick={() => setSelectedPetId(pet.id)}><div><strong>{pet.name} · {pet.species}</strong><p className="muted">{pet.owner.fullName}</p></div><span className="pill">{pet.medicalRecords.length} fichas</span></button></li>)}
          </ul>
        </article>
        <article className="card detail-card">
          {selectedPet ? <>
            <div className="detail-header"><div><span className="eyebrow">Paciente</span><h3>{selectedPet.name} · {selectedPet.species}</h3></div><span className="pill">{selectedPet.breed || "Sin raza"}</span></div>
            <div className="detail-grid">
              <div><small>Dueño</small><strong>{selectedPet.owner.fullName}</strong></div>
              <div><small>Contacto</small><strong>{selectedPet.owner.phone || selectedPet.owner.email}</strong></div>
              <div><small>Edad</small><strong>{selectedPet.age ? `${selectedPet.age} años` : "No registrada"}</strong></div>
              <div><small>Sector</small><strong>{selectedPet.owner.sector || "Sin sector"}</strong></div>
            </div>
            <p>{selectedPet.notes || "Sin observaciones registradas."}</p>
            <h4>Citas registradas</h4>
            <ul className="simple-list compact-list">{selectedPet.appointments.length ? selectedPet.appointments.map((appointment) => <li key={appointment.id}><span>{formatDateTime(appointment.scheduledAt)} · {prettifyEnum(appointment.status)} · {appointment.reason}</span></li>) : <li><span>Sin citas registradas</span></li>}</ul>
            <h4>Fichas médicas</h4>
            <ul className="simple-list compact-list">{selectedPet.medicalRecords.length ? selectedPet.medicalRecords.map((record) => <li key={record.id}><div><strong>{record.diagnosis}</strong><p className="muted">{record.veterinarian.fullName} · {formatDate(record.createdAt)}</p></div><span>{record.treatment}</span></li>) : <li><span>Sin fichas médicas registradas</span></li>}</ul>
          </> : <p className="feedback">No hay mascotas que coincidan con el filtro actual.</p>}
        </article>
      </div>
      <article className="card section-gap-top">
        <h3>Nueva ficha médica</h3>
        <form className="form-stack" onSubmit={onMedicalRecordSubmit}><label>Mascota<select {...medicalRecordForm.register("petId")} required><option value="">Selecciona una mascota</option>{petRows.map((pet: AdminPet) => <option key={pet.id} value={pet.id}>{pet.name} · {pet.owner.fullName}</option>)}</select></label><label>Veterinario<select {...medicalRecordForm.register("veterinarianId")} required><option value="">Selecciona veterinario</option>{veterinarianRows.map((vet: Veterinarian) => <option key={vet.user.id} value={vet.user.id}>{vet.user.fullName}</option>)}</select></label><label>Diagnóstico<textarea rows={3} {...medicalRecordForm.register("diagnosis")} required /></label><label>Tratamiento<textarea rows={3} {...medicalRecordForm.register("treatment")} required /></label><button className="btn btn-primary">Guardar ficha</button></form>
      </article>
    </section>

    <section className="admin-section" id="reportes">
      <div className="admin-section-head">
        <div><span className="eyebrow">Incidencias</span><h2>Reportes de abandono</h2></div>
        <input value={reportSearch} onChange={(event) => setReportSearch(event.target.value)} placeholder="Buscar por descripción, estado o reportante" />
      </div>
      <div className="admin-master-detail">
        <article className="card admin-list-card">
          <h3>Bandeja de reportes</h3>
          <ul className="simple-list selectable-list">
            {filteredReports.map((report) => <li key={report.id} className={selectedReport?.id === report.id ? "selected" : ""}><button type="button" className="list-button" onClick={() => setSelectedReportId(report.id)}><div><strong>{report.reporter.fullName}</strong><p className="muted">{formatDateTime(report.createdAt)}</p></div><span className="pill">{prettifyEnum(report.status)}</span></button></li>)}
          </ul>
        </article>
        <article className="card detail-card">
          {selectedReport ? <>
            <div className="detail-header"><div><span className="eyebrow">Detalle</span><h3>{selectedReport.reporter.fullName}</h3></div><span className="pill">{prettifyEnum(selectedReport.status)}</span></div>
            <p>{selectedReport.description}</p>
            <div className="detail-grid">
              <div><small>Rol reportante</small><strong>{roleLabel(selectedReport.reporter.role)}</strong></div>
              <div><small>Fecha</small><strong>{formatDateTime(selectedReport.createdAt)}</strong></div>
              <div><small>Latitud</small><strong>{selectedReport.latitude}</strong></div>
              <div><small>Longitud</small><strong>{selectedReport.longitude}</strong></div>
            </div>
            <a className="btn btn-ghost btn-sm" href={`https://www.google.com/maps?q=${selectedReport.latitude},${selectedReport.longitude}`} target="_blank" rel="noreferrer">Abrir ubicación</a>
          </> : <p className="feedback">No hay reportes que coincidan con el filtro actual.</p>}
        </article>
      </div>
    </section>

    <section className="admin-section" id="donaciones">
      <div className="admin-section-head">
        <div><span className="eyebrow">Finanzas solidarias</span><h2>Donaciones registradas</h2></div>
        <input value={donationSearch} onChange={(event) => setDonationSearch(event.target.value)} placeholder="Buscar por donante, tipo o mensaje" />
      </div>
      <div className="admin-master-detail">
        <article className="card admin-list-card">
          <h3>Movimientos</h3>
          <ul className="simple-list selectable-list">
            {filteredDonations.map((donation) => <li key={donation.id} className={selectedDonation?.id === donation.id ? "selected" : ""}><button type="button" className="list-button" onClick={() => setSelectedDonationId(donation.id)}><div><strong>{donation.donor.fullName}</strong><p className="muted">{formatDateTime(donation.createdAt)}</p></div><span className="pill">{formatCurrency(donation.amount)}</span></button></li>)}
          </ul>
        </article>
        <article className="card detail-card">
          {selectedDonation ? <>
            <div className="detail-header"><div><span className="eyebrow">Detalle</span><h3>{selectedDonation.donor.fullName}</h3></div><span className="pill">{prettifyEnum(selectedDonation.kind)}</span></div>
            <div className="detail-grid">
              <div><small>Monto</small><strong>{formatCurrency(selectedDonation.amount)}</strong></div>
              <div><small>Fecha</small><strong>{formatDateTime(selectedDonation.createdAt)}</strong></div>
              <div><small>Tipo</small><strong>{prettifyEnum(selectedDonation.kind)}</strong></div>
              <div><small>Total acumulado</small><strong>{formatCurrency(totalDonationAmount)}</strong></div>
            </div>
            <p>{selectedDonation.message || "Sin mensaje adjunto."}</p>
          </> : <p className="feedback">No hay donaciones que coincidan con el filtro actual.</p>}
        </article>
      </div>
    </section>

    <section className="admin-section" id="inventario">
      <div className="admin-section-head">
        <div><span className="eyebrow">Abastecimiento</span><h2>Inventario y reposición</h2></div>
        <span className="pill">{lowStockItems.length} insumos con stock bajo</span>
      </div>
      <div className="grid-2">
        <article className="card">
          <h3>Registrar o actualizar suministro</h3>
          <form className="form-stack" onSubmit={onSubmit}><label>Nombre<input {...register("name")} required /></label><div className="field-row"><label>Stock<input type="number" {...register("stock", { valueAsNumber: true })} required /></label><label>Unidad<input {...register("unit")} required /></label></div><button className="btn btn-primary">Guardar suministro</button></form>
        </article>
        <article className="card">
          <h3>Existencias</h3>
          <ul className="simple-list compact-list">{supplyRows.map((supply) => <li key={supply.id}><div><strong>{supply.name}</strong><p className="muted">{supply.stock} {supply.unit}</p></div><span className={`pill ${supply.stock <= 10 ? "pill-alert" : ""}`}>{supply.stock <= 10 ? "Reponer" : "Estable"}</span></li>)}</ul>
        </article>
      </div>
    </section>
  </div>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="metric-card"><span>{label}</span><strong>{value}</strong></div>;
}

function PageLayout({ kicker, title, lead, children }: { kicker: string; title: string; lead: string; children: ReactNode }) {
  return <><section className="container page-heading"><span className="kicker">{kicker}</span><h1>{title}</h1><p className="lead">{lead}</p></section><section className="container">{children}</section></>;
}

function ProtectedPage({ allowed, children }: { allowed: string[]; children: ReactNode }) {
  const auth = useAuth();
  if (!auth.user) return <PageLayout kicker="Acceso requerido" title="Inicia sesión" lead="Necesitas autenticarte para entrar a este módulo."><button className="btn btn-primary" onClick={() => auth.setOpen(true)}>Abrir acceso</button></PageLayout>;
  if (!allowed.includes(auth.user.role)) return <PageLayout kicker="Acceso restringido" title="Sin permisos" lead="Tu rol actual no tiene acceso a este módulo."><Link to="/">Volver al inicio</Link></PageLayout>;
  return <>{children}</>;
}

function AuthModal() {
  const auth = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const { register, handleSubmit, reset } = useForm<{ fullName: string; email: string; password: string; role: string; sector?: string }>();

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (mode === "login") {
        await auth.login(values.email, values.password);
      } else {
        await auth.register({ ...values, role: values.role });
      }
      reset();
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo completar la acción");
    }
  });

  return <div className="modal"><div className="modal-backdrop" onClick={() => auth.setOpen(false)} /><section className="modal-content"><button type="button" className="modal-close" onClick={() => auth.setOpen(false)}>×</button><h2>{mode === "login" ? "Ingresa a tu cuenta" : "Crea tu cuenta"}</h2><p className="muted">{mode === "login" ? "Continúa donde lo dejaste." : "Selecciona el tipo de cuenta que mejor te describe."}</p><form className="form-stack" onSubmit={onSubmit}><div className="auth-mode-row"><button type="button" className={`btn ${mode === "login" ? "btn-primary" : "btn-soft"}`} onClick={() => setMode("login")}>Ya tengo cuenta</button><button type="button" className={`btn ${mode === "register" ? "btn-primary" : "btn-soft"}`} onClick={() => setMode("register")}>Crear cuenta</button></div>{mode === "register" && <label>Nombre completo<input {...register("fullName")} required={mode === "register"} /></label>}<label>Correo electrónico<input type="email" {...register("email")} required /></label><label>Contraseña<input type="password" {...register("password")} minLength={8} required /></label>{mode === "register" && <><label>Tipo de cuenta<select {...register("role")} defaultValue="OWNER"><option value="OWNER">Dueño de mascota</option><option value="CITIZEN">Ciudadano</option><option value="VOLUNTEER">Voluntario</option><option value="DONOR">Donante</option></select></label><label>Sector<input {...register("sector")} /></label></>}<button className="btn btn-primary full">{mode === "login" ? "Ingresar" : "Crear cuenta"}</button></form></section></div>;
}
