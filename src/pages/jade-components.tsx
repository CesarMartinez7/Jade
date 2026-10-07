import type React from "react";
import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  cx,
  Divider,
  Field,
  IconButton,
  Input,
  Kbd,
  Magnet,
  Marquee,
  Modal,
  ModalBody,
  ModalClose,
  ModalHeader,
  Panel,
  PanelBody,
  PanelHeader,
  PanelTitle,
  Progress,
  Reveal,
  ShinyText,
  Spinner,
  Sticker,
  Switch,
  StickerWord,
  Tab,
  Table,
  Tabs,
  Textarea,
  Tilt,
  Typewriter,
  type CardTone,
  type TableColumn,
} from "../jade";
import { copyText } from "../lib/browser";
import { useUi } from "../stores/ui";
import {
  Icon,
  iconAlert,
  iconBolt,
  iconBraces,
  iconCheck,
  iconCopy,
  iconDownload,
  iconKey,
  iconRegex,
  iconSearch,
  iconTrash,
  iconX,
} from "../ui/icons";
import { Logo } from "../ui/logo";
import { AlphabetCreator } from "./alphabet-creator";

interface SpecimenProps {
  name: string;
  description: string;
  code: string;
  tone?: CardTone;
  wide?: boolean;
  children: React.ReactNode;
}

function Specimen({ name, description, code, tone = "yellow", wide, children }: SpecimenProps) {
  return (
    <Card className={cx("flex flex-col", wide && "lg:col-span-2")}>
      <CardHeader tone={tone}>
        <div className="min-w-0">
          <h3 className="text-sm leading-tight font-extrabold">{name}</h3>
          <p className="truncate text-[11px] font-medium opacity-70">{description}</p>
        </div>
        <button
          type="button"
          aria-label={`Copiar uso de ${name}`}
          className="icon-btn text-onfill hover:border-onfill hover:bg-white"
          onClick={() => copyText(code, "Uso copiado")}
        >
          <Icon icon={iconCopy} width={14} />
        </button>
      </CardHeader>
      <div className="dotted flex flex-wrap items-center gap-3 p-5">{children}</div>
      <details className="border-t-2 border-ink bg-panel">
        <summary className="label cursor-pointer list-none px-4 py-2 select-none">Uso</summary>
        <pre className="overflow-auto border-t-2 border-ink bg-bg p-3 font-mono text-[11px] leading-5 text-muted">
          {code}
        </pre>
      </details>
    </Card>
  );
}

const PANEL_TONES = ["yellow", "lilac", "pink"] as const;
const MARQUEE_WORDS = ["Jade", "JSON", "JWT", "Regex", "Diff", "Colores"];
const TYPE_WORDS = ["JSON", "JWT", "Regex", "Diff", "Colores"];

interface ToolRow {
  name: string;
  kind: string;
  status: "estable" | "nuevo" | "beta";
  lines: number;
}

const TABLE_ROWS: ToolRow[] = [
  { name: "JSON", kind: "Datos", status: "estable", lines: 248 },
  { name: "Comparar texto", kind: "Texto", status: "estable", lines: 178 },
  { name: "JWT", kind: "Seguridad", status: "estable", lines: 188 },
  { name: "Regex", kind: "Texto", status: "nuevo", lines: 402 },
  { name: "Colores", kind: "Diseño", status: "beta", lines: 236 },
];

const STATUS_TONES = { estable: "ok", nuevo: "warn", beta: "default" } as const;

const TABLE_COLUMNS: TableColumn<ToolRow>[] = [
  { key: "name", header: "Herramienta", sortable: true, className: "font-bold" },
  { key: "kind", header: "Categoría", sortable: true },
  {
    key: "status",
    header: "Estado",
    render: (row) => <Badge tone={STATUS_TONES[row.status]}>{row.status}</Badge>,
  },
  { key: "lines", header: "Líneas", align: "right", sortable: true, className: "font-mono" },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="col-span-full mt-2 flex items-center gap-3 text-lg font-extrabold">
      {children}
      <span className="h-0.5 flex-1 rounded-full bg-ink" />
    </h2>
  );
}

export default function JadeComponentsPage() {
  const theme = useUi((state) => state.theme);
  const toggleTheme = useUi((state) => state.toggleTheme);

  const [tab, setTab] = useState("json");
  const [night, setNight] = useState(true);
  const [progress, setProgress] = useState(64);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b-2 border-ink bg-page px-4 py-3">
        <Logo size={34} />
        <div className="mr-auto min-w-0">
          <p className="text-lg leading-none font-extrabold tracking-tight">Jade Components</p>
          <p className="text-[11px] font-semibold text-muted">
            Librería de primitivos del diseño Jade
          </p>
        </div>
        <Button onClick={toggleTheme}>{theme === "dia" ? "☀ Día" : "☾ Noche"}</Button>
        <a href="#json" className="btn">
          Ir a herramientas
        </a>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-4 md:p-6">
        <Card>
          <CardHeader tone="mint">
            <span className="label">Neo-brutalismo jade</span>
            <Badge tone="ok">listo</Badge>
          </CardHeader>
          <CardBody className="flex flex-col items-center gap-4 py-8 text-center">
            <StickerWord word="JADE" className="w-full max-w-md" />
            <p className="max-w-xl text-balance px-2 text-sm font-semibold">
              Componentes reutilizables con borde grueso, sombra dura y colores planos. Cópialos a
              cualquier proyecto que use las mismas variables de tema.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge>Button</Badge>
              <Badge>Panel</Badge>
              <Badge>Card</Badge>
              <Badge>Alert</Badge>
              <Badge>Switch</Badge>
              <Badge>Table</Badge>
            </div>
          </CardBody>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          <SectionTitle>Primitivos</SectionTitle>
          <Specimen
            name="Button"
            description="Acciones con variantes y hundido al pulsar"
            code={`<Button>Guardar</Button>
<Button variant="primary" icon={iconBolt}>Formatear</Button>
<Button variant="ghost">Copiar</Button>
<Button variant="danger" icon={iconTrash}>Limpiar</Button>`}
          >
            <Button>Default</Button>
            <Button variant="primary" icon={iconBolt}>
              Primary
            </Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger" icon={iconTrash}>
              Danger
            </Button>
            <Button disabled>Disabled</Button>
          </Specimen>

          <Specimen
            name="IconButton"
            description="Botón solo con icono, con etiqueta accesible"
            tone="lilac"
            code={`<IconButton icon={iconCopy} label="Copiar" />
<IconButton icon={iconDownload} label="Descargar" />`}
          >
            <IconButton icon={iconCopy} label="Copiar" />
            <IconButton icon={iconDownload} label="Descargar" />
            <IconButton icon={iconSearch} label="Buscar" />
            <IconButton icon={iconX} label="Cerrar" />
          </Specimen>

          <Specimen
            name="Badge"
            description="Etiquetas compactas con tonos semánticos"
            tone="pink"
            code={`<Badge>neutro</Badge>
<Badge tone="ok">válido</Badge>
<Badge tone="warn">revisar</Badge>
<Badge tone="danger">inválido</Badge>`}
          >
            <Badge>neutro</Badge>
            <Badge tone="ok">válido</Badge>
            <Badge tone="warn">revisar</Badge>
            <Badge tone="danger">inválido</Badge>
          </Specimen>

          <Specimen
            name="Sticker · Divider · Kbd"
            description="Detalles de la identidad Jade"
            tone="mint"
            code={`<Sticker>pegatina</Sticker>
<Divider />
<Kbd>Ctrl K</Kbd>`}
          >
            <Sticker>pegatina</Sticker>
            <Divider />
            <span className="text-xs font-bold">texto</span>
            <Divider />
            <Kbd>Ctrl K</Kbd>
            <Kbd>Esc</Kbd>
          </Specimen>

          <Specimen
            name="Panel"
            description="Contenedor con cabecera de color y cuerpo desplazable"
            wide
            code={`<Panel tone="yellow">
  <PanelHeader>
    <PanelTitle>Entrada</PanelTitle>
    <Badge tone="ok">válido</Badge>
  </PanelHeader>
  <PanelBody className="p-4">…</PanelBody>
</Panel>`}
          >
            <div className="grid w-full gap-3 sm:grid-cols-3">
              {PANEL_TONES.map((tone) => (
                <Panel key={tone} tone={tone} className="h-40">
                  <PanelHeader>
                    <PanelTitle>{tone}</PanelTitle>
                    <Badge tone="ok">on</Badge>
                  </PanelHeader>
                  <PanelBody className="p-4 text-xs font-medium text-muted">
                    Cuerpo del panel con desplazamiento propio.
                  </PanelBody>
                </Panel>
              ))}
            </div>
          </Specimen>

          <Specimen
            name="Card"
            description="Tarjeta estática con cabecera y cuerpo"
            code={`<Card>
  <CardHeader tone="mint"><span className="label">Tarjeta</span></CardHeader>
  <CardBody>…</CardBody>
</Card>`}
          >
            <Card className="w-full max-w-xs">
              <CardHeader tone="mint">
                <span className="label">Tarjeta</span>
                <Badge tone="ok">nuevo</Badge>
              </CardHeader>
              <CardBody>
                <p className="text-xs font-medium text-muted">
                  Un bloque de contenido con la firma visual de Jade.
                </p>
                <Button className="mt-3" variant="primary" icon={iconCheck}>
                  Aceptar
                </Button>
              </CardBody>
            </Card>
          </Specimen>

          <Specimen
            name="Progress"
            description="Barra de progreso plana"
            tone="lilac"
            code={`<Progress value={64} />
<Progress value={82} tone="pink" />`}
          >
            <div className="flex w-full flex-col gap-3">
              <Progress value={progress} />
              <Progress value={82} tone="pink" />
              <Progress value={45} tone="yellow" />
              <Button
                className="self-start"
                icon={iconBolt}
                onClick={() => setProgress((prev) => (prev + 20) % 101)}
              >
                Avanzar
              </Button>
            </div>
          </Specimen>

          <Specimen
            name="Tabs"
            description="Navegación por pestañas"
            code={`<Tabs value={tab} onChange={setTab}>
  <Tab value="json" icon={iconBraces}>JSON</Tab>
  <Tab value="jwt" icon={iconKey}>JWT</Tab>
</Tabs>`}
          >
            <div className="flex w-full flex-col gap-3">
              <Tabs value={tab} onChange={setTab}>
                <Tab value="json" icon={iconBraces}>
                  JSON
                </Tab>
                <Tab value="jwt" icon={iconKey}>
                  JWT
                </Tab>
                <Tab value="regex" icon={iconRegex}>
                  Regex
                </Tab>
              </Tabs>
              <p className="text-xs font-medium text-muted">
                Pestaña activa: <span className="font-bold text-fg">{tab}</span>
              </p>
            </div>
          </Specimen>

          <Specimen
            name="Switch"
            description="Interruptor de dos estados"
            tone="mint"
            code={`<Switch checked={night} onChange={setNight} label="Modo noche" />`}
          >
            <Switch checked={night} onChange={setNight} label="Modo noche" />
            <span className="text-xs font-bold">{night ? "Activado" : "Desactivado"}</span>
            <Switch checked={false} onChange={() => {}} label="Deshabilitado" disabled />
          </Specimen>

          <Specimen
            name="Input · Textarea · Field"
            description="Campos de formulario"
            code={`<Field label="Correo" hint="Nunca sale de tu navegador">
  <Input placeholder="tu@correo.com" />
</Field>
<Textarea rows={2} placeholder="Escribe algo…" />`}
          >
            <div className="flex w-full flex-col gap-3">
              <Field label="Correo" hint="Nunca sale de tu navegador">
                <Input type="email" placeholder="tu@correo.com" />
              </Field>
              <Textarea rows={2} placeholder="Escribe algo…" />
            </div>
          </Specimen>

          <Specimen
            name="Spinner"
            description="Indicador de carga"
            tone="pink"
            code={`<Spinner />
<Spinner label="Cargando…" />`}
          >
            <Spinner />
            <Spinner label="Cargando…" />
          </Specimen>

          <Specimen
            name="Alert"
            description="Mensajes con tono semántico"
            wide
            code={`<Alert tone="ok" icon={iconCheck} title="Listo">…</Alert>
<Alert tone="danger" icon={iconAlert} title="Error">…</Alert>`}
          >
            <div className="grid w-full gap-3 md:grid-cols-2">
              <Alert tone="info" icon={iconBolt} title="Información">
                Todo se procesa en tu navegador.
              </Alert>
              <Alert tone="ok" icon={iconCheck} title="Correcto">
                El JSON es válido.
              </Alert>
              <Alert tone="warn" icon={iconAlert} title="Atención">
                Hay claves duplicadas.
              </Alert>
              <Alert tone="danger" icon={iconAlert} title="Error">
                No se pudo analizar la entrada.
              </Alert>
            </div>
          </Specimen>

          <Specimen
            name="Table"
            description="Tabla de datos con cabecera de color y columnas ordenables"
            tone="lilac"
            wide
            code={`const columns: TableColumn<Row>[] = [
  { key: "name", header: "Herramienta", sortable: true },
  { key: "status", header: "Estado", render: (row) => <Badge>{row.status}</Badge> },
  { key: "lines", header: "Líneas", align: "right", sortable: true },
];

<Table columns={columns} rows={rows} rowKey={(row) => row.name} tone="lilac" striped />`}
          >
            <Table
              className="w-full"
              columns={TABLE_COLUMNS}
              rows={TABLE_ROWS}
              rowKey={(row) => row.name}
              tone="lilac"
              striped
            />
          </Specimen>

          <SectionTitle>Modales</SectionTitle>
          <Specimen
            name="Modal"
            description="Diálogo con cabecera de color, cuerpo y pie de acciones"
            tone="mint"
            wide
            code={`<Modal
  open={open}
  onClose={close}
  title="Guardar cambios"
  footer={
    <>
      <Button variant="ghost" onClick={close}>Cancelar</Button>
      <Button variant="primary">Guardar</Button>
    </>
  }
>
  <p>Los cambios se aplican solo en tu navegador.</p>
</Modal>`}
          >
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              Abrir modal
            </Button>
            <Modal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              title="Guardar cambios"
              size="sm"
              tone="mint"
              footer={
                <>
                  <Button variant="ghost" onClick={() => setModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button variant="primary" onClick={() => setModalOpen(false)}>
                    Guardar
                  </Button>
                </>
              }
            >
              <p className="mb-3">
                Los cambios se aplican solo en tu navegador, nada sale de tu equipo.
              </p>
              <Field label="Nombre del proyecto" hint="Visible solo para ti">
                <Input defaultValue="Jade" />
              </Field>
            </Modal>
          </Specimen>

          <Specimen
            name="Modal · cabecera propia"
            description="Composición libre con ModalHeader, ModalBody y ModalClose"
            tone="pink"
            wide
            code={`<Modal open={open} onClose={close} ariaLabel="Buscador" size="md">
  <ModalHeader>
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <input placeholder="Filtrar…" />
      <kbd>Esc</kbd>
    </div>
    <ModalClose />
  </ModalHeader>
  <ModalBody className="p-1.5">…</ModalBody>
</Modal>`}
          >
            <Button icon={iconSearch} onClick={() => setSearchOpen(true)}>
              Abrir buscador
            </Button>
            <Modal
              open={searchOpen}
              onClose={() => setSearchOpen(false)}
              ariaLabel="Buscador de ejemplos"
              size="md"
            >
              <ModalHeader>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Icon icon={iconSearch} width={16} className="shrink-0 text-faint" />
                  <input
                    autoFocus
                    placeholder="Filtrar elementos…"
                    aria-label="Filtrar elementos"
                    className="h-9 min-w-0 flex-1 bg-transparent text-sm placeholder:text-faint focus:outline-none"
                  />
                  <kbd>Esc</kbd>
                </div>
                <ModalClose />
              </ModalHeader>
              <ModalBody className="p-1.5">
                <ul>
                  {TYPE_WORDS.map((item) => (
                    <li
                      key={item}
                      className="cursor-pointer rounded-lg border-2 border-transparent px-3 py-2 text-sm font-semibold hover:border-ink hover:bg-yellow"
                      onClick={() => setSearchOpen(false)}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </ModalBody>
            </Modal>
          </Specimen>

          <Specimen
            name="ConfirmDialog"
            description="Confirmación destructiva lista para usar"
            tone="lilac"
            code={`<ConfirmDialog
  open={open}
  onClose={close}
  onConfirm={remove}
  title="¿Eliminar datos?"
  confirmLabel="Eliminar"
>
  Esta acción no se puede deshacer.
</ConfirmDialog>`}
          >
            <Button
              variant="danger"
              icon={iconTrash}
              onClick={() => {
                setConfirmed(false);
                setConfirmOpen(true);
              }}
            >
              Eliminar datos
            </Button>
            {confirmed && <Badge tone="ok">confirmado</Badge>}
            <ConfirmDialog
              open={confirmOpen}
              onClose={() => setConfirmOpen(false)}
              onConfirm={() => setConfirmed(true)}
              title="¿Eliminar datos?"
              confirmLabel="Eliminar"
            >
              Se borrarán los datos de ejemplo. Esta acción no se puede deshacer.
            </ConfirmDialog>
          </Specimen>

          <SectionTitle>Alfabeto</SectionTitle>
          <AlphabetCreator />

          <SectionTitle>Animados</SectionTitle>
          <Specimen
            name="Marquee"
            description="Cinta infinita que pausa al pasar el cursor"
            wide
            code={`<Marquee speed={18}>
  {items.map((w) => <Sticker key={w}>{w}</Sticker>)}
</Marquee>`}
          >
            <Marquee speed={18} className="w-full">
              {MARQUEE_WORDS.map((word) => (
                <Sticker key={word} className="whitespace-nowrap">
                  {word}
                </Sticker>
              ))}
            </Marquee>
          </Specimen>

          <Specimen
            name="Reveal"
            description="Aparece al entrar en pantalla (scroll)"
            tone="lilac"
            code={`<Reveal delay={0.1}>
  <Card className="p-3">…</Card>
</Reveal>`}
          >
            <div className="flex w-full flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <Reveal key={i} delay={i * 0.12}>
                  <Card className="px-3 py-2 text-xs font-semibold">
                    Bloque {i + 1} que aparece al hacer scroll
                  </Card>
                </Reveal>
              ))}
            </div>
          </Specimen>

          <Specimen
            name="Magnet"
            description="Se imanta hacia el cursor"
            tone="pink"
            code={`<Magnet radius={140} strength={0.4}>
  <Sticker>Acércate</Sticker>
</Magnet>`}
          >
            <Magnet radius={140} strength={0.5} className="p-8">
              <Sticker className="text-sm">Acércate</Sticker>
            </Magnet>
          </Specimen>

          <Specimen
            name="Tilt"
            description="Inclinación 3D siguiendo el cursor"
            tone="mint"
            code={`<Tilt max={14}>
  <Card className="w-40">…</Card>
</Tilt>`}
          >
            <Tilt max={14}>
              <Card className="w-40">
                <CardHeader tone="pink">
                  <span className="label">3D</span>
                </CardHeader>
                <CardBody className="text-xs font-semibold">Pasa el cursor por encima</CardBody>
              </Card>
            </Tilt>
          </Specimen>

          <Specimen
            name="Typewriter"
            description="Texto que se escribe y borra"
            code={`<Typewriter words={["JSON", "JWT", "Regex"]} />`}
          >
            <p className="text-lg leading-none">
              Herramientas para <Typewriter words={TYPE_WORDS} className="text-accent" />
            </p>
          </Specimen>

          <Specimen
            name="ShinyText"
            description="Brillo que recorre el texto"
            tone="lilac"
            code={`<ShinyText speed={3}>Jade Components</ShinyText>`}
          >
            <p className="text-2xl leading-none font-extrabold">
              <ShinyText>Jade Components</ShinyText>
            </p>
          </Specimen>
        </div>

        <footer className="pt-2 pb-6 text-center text-[11px] font-semibold text-muted">
          Importa desde <code className="font-mono">./jade</code> · 100% local
        </footer>
      </main>
    </div>
  );
}
