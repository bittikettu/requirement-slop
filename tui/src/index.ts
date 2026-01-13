import blessed from 'blessed';
import { api, Requirement, Project } from './api.ts';

const screen = blessed.screen({
  smartCSR: true,
  title: 'ReqTool TUI',
  fullUnicode: true,
  cursor: {
    artificial: true,
    shape: 'line',
    blink: true,
    color: 'cyan'
  }
});

// Color Scheme
const COLORS = {
  header: '#005fdf',
  projectBorder: '#ffaf00',
  listBorder: '#00afff',
  detailBorder: '#00ff00',
  formBorder: '#af00ff',
  success: '#00ff00',
  error: '#ff0000',
  ai: '#00ffff',
  statusBar: '#ffffff',
  statusBarText: '#000000',
  focused: '#ffffff'
};

const projectList = blessed.list({
  parent: screen,
  width: '20%',
  height: '90%',
  top: 1,
  left: 0,
  border: { type: 'line' },
  style: {
    border: { fg: COLORS.projectBorder },
    selected: { bg: 'blue', bold: true }
  },
  keys: true,
  mouse: true,
  label: ' {bold}Projects{/bold} ',
  tags: true
});

const list = blessed.list({
  parent: screen,
  width: '30%',
  height: '90%',
  top: 1,
  left: '20%',
  border: { type: 'line' },
  style: {
    border: { fg: COLORS.listBorder },
    selected: { bg: 'blue', bold: true }
  },
  keys: true,
  mouse: true,
  label: ' {bold}Requirements{/bold} ',
  tags: true
});

const detail = blessed.box({
  parent: screen,
  width: '50%',
  height: '90%',
  top: 1,
  left: '50%',
  border: { type: 'line' },
  padding: 1,
  label: ' {bold}Detail{/bold} ',
  scrollbar: {
    ch: ' ',
    track: { bg: 'cyan' },
    style: { inverse: true }
  },
  style: {
    border: { fg: COLORS.detailBorder }
  },
  tags: true
});

const statusBar = blessed.box({
  parent: screen,
  bottom: 0,
  height: 1,
  width: '100%',
  style: { bg: COLORS.statusBar, fg: COLORS.statusBarText },
  content: ' q: Quit | r: Refresh | n: New Req | Tab: Switch Panel | Enter: Select '
});

const header = blessed.box({
  parent: screen,
  top: 0,
  height: 1,
  width: '100%',
  style: { bold: true, bg: COLORS.header, fg: 'white' },
  content: '  ReqTool TUI v1.3 - Project Fleet Commander  '
});

let projects: Project[] = [];
let allRequirements: Requirement[] = [];
let filteredRequirements: Requirement[] = [];
let selectedProjectId: number | null = null;

async function refreshData() {
  projectList.setItems(['{center}Loading...{/center}']);
  list.setItems(['{center}Loading...{/center}']);
  screen.render();
  try {
    const [pData, rData] = await Promise.all([
      api.listProjects(),
      api.listRequirements()
    ]);
    projects = pData;
    allRequirements = rData;
    
    projectList.setItems(projects.map(p => ` {yellow-fg}${p.prefix}{/yellow-fg} | {white-fg}${p.name}{/white-fg}`));
    
    if (projects.length > 0 && selectedProjectId === null) {
        selectedProjectId = projects[0].id;
        projectList.select(0);
    }
    
    updateRequirementList();
  } catch (err) {
    projectList.setItems(['{red-fg}Error{/red-fg}']);
    list.setItems(['{red-fg}Error{/red-fg}']);
  }
  screen.render();
}

function updateRequirementList() {
  filteredRequirements = allRequirements.filter(r => r.project_id === selectedProjectId);
  if (filteredRequirements.length === 0) {
    list.setItems(['{center}No requirements{/center}']);
  } else {
    list.setItems(filteredRequirements.map(r => ` {cyan-fg}${r.id}{/cyan-fg} | ${r.title}`));
  }
  screen.render();
}

projectList.on('select', (item, index) => {
  const project = projects[index];
  if (project) {
    selectedProjectId = project.id;
    updateRequirementList();
    list.focus();
  }
});

function toAsciiDoc(req: Requirement): string {
  const lines: string[] = [];
  lines.push(`{yellow-fg}[[${req.id}]]{/yellow-fg}`);
  lines.push(`{cyan-fg}=== ${req.id}: ${req.title}{/cyan-fg}`);
  lines.push("");
  lines.push("[horizontal]");
  lines.push(`{bold}Description::{/bold}\n${req.description || 'N/A'}`);
  lines.push(`{bold}Rationale::{/bold}\n${req.rationale || 'N/A'}`);
  lines.push(`{bold}Priority::{/bold}\n{green-fg}${req.priority}{/green-fg}`);
  lines.push(`{bold}Status::{/bold}\n{yellow-fg}${req.status}{/yellow-fg}`);
  
  if (req.outgoing_traces && req.outgoing_traces.length > 0) {
    lines.push(`{bold}Traces to::{/bold}\n${req.outgoing_traces.map(t => `- <<{blue-fg}${t.target_id}{/blue-fg}>>`).join('\n')}`);
  }
  
  return lines.join('\n');
}

list.on('select', (item, index) => {
  const req = filteredRequirements[index];
  if (req) {
    detail.setLabel(` {bold}${req.id}{/bold} `);
    detail.setContent(toAsciiDoc(req));
    screen.render();
  }
});

// Focus Rotation
const focusable = [projectList, list, detail];
let focusIdx = 0;

function updateFocus() {
    focusable.forEach((el, i) => {
        const baseColor = i === 0 ? COLORS.projectBorder : (i === 1 ? COLORS.listBorder : COLORS.detailBorder);
        el.style.border.fg = (i === focusIdx) ? COLORS.focused : baseColor;
    });
    focusable[focusIdx].focus();
    screen.render();
}

screen.key(['tab'], () => {
    focusIdx = (focusIdx + 1) % focusable.length;
    updateFocus();
});

screen.key(['S-tab'], () => {
    focusIdx = (focusIdx - 1 + focusable.length) % focusable.length;
    updateFocus();
});

function showExitConfirmation() {
  const question = blessed.question({
    parent: screen,
    top: 'center',
    left: 'center',
    width: 50,
    height: 10,
    border: { type: 'line' },
    label: ' {bold}Exit{/bold} ',
    content: '\n{center}Do you really want to quit?{/center}',
    keys: true,
    tags: true,
    style: {
      border: { fg: COLORS.error },
      bg: '#1a1a1a'
    }
  });

  question.ask('Do you really want to quit?', (err, value) => {
    if (value) {
      process.exit(0);
    }
    question.destroy();
    screen.render();
    updateFocus();
  });
}

function showCreateForm() {
  const form = blessed.form({
    parent: screen,
    width: '80%',
    height: '80%',
    top: 'center',
    left: 'center',
    border: { type: 'line' },
    label: ' {bold}Create New Requirement{/bold} ',
    keys: true,
    padding: 1,
    tags: true,
    style: {
      border: { fg: COLORS.formBorder }
    }
  });

  blessed.text({ parent: form, top: 0, left: 1, content: '{bold}Title:{/bold}', tags: true });
  const titleInput = blessed.textbox({
    parent: form,
    top: 1,
    left: 1,
    width: '95%',
    height: 3,
    border: 'line',
    keys: true,
    inputOnFocus: true,
    style: {
      border: { fg: 'white' },
      focus: { border: { fg: 'cyan' } }
    },
    cursor: {
      blink: true,
      shape: 'block',
      color: 'cyan'
    }
  });

  blessed.text({ parent: form, top: 4, left: 1, content: '{bold}Description:{/bold}', tags: true });
  const descInput = blessed.textarea({
    parent: form,
    top: 5,
    left: 1,
    width: '95%',
    height: 6,
    border: 'line',
    keys: true,
    inputOnFocus: true,
    style: {
      border: { fg: 'white' },
      focus: { border: { fg: 'cyan' } }
    },
    cursor: {
      blink: true,
      shape: 'block',
      color: 'cyan'
    }
  });

  const aiDescButton = blessed.button({
    parent: form,
    top: 12,
    left: 1,
    width: 18,
    height: 3,
    content: '{center}✨ AI Gen Desc{/center}',
    tags: true,
    border: 'line',
    style: { 
      border: { fg: COLORS.ai },
      hover: { bg: COLORS.ai, fg: 'black' }, 
      focus: { bg: COLORS.ai, fg: 'black' } 
    }
  });

  blessed.text({ parent: form, top: 16, left: 1, content: '{bold}Rationale:{/bold}', tags: true });
  const rationaleInput = blessed.textarea({
    parent: form,
    top: 17,
    left: 1,
    width: '95%',
    height: 4,
    border: 'line',
    keys: true,
    inputOnFocus: true,
    style: {
      border: { fg: 'white' },
      focus: { border: { fg: 'cyan' } }
    },
    cursor: {
      blink: true,
      shape: 'block',
      color: 'cyan'
    }
  });

  const aiRatioButton = blessed.button({
    parent: form,
    top: 22,
    left: 1,
    width: 18,
    height: 3,
    content: '{center}✨ AI Gen Ratio{/center}',
    tags: true,
    border: 'line',
    style: { 
      border: { fg: COLORS.ai },
      hover: { bg: COLORS.ai, fg: 'black' }, 
      focus: { bg: COLORS.ai, fg: 'black' } 
    }
  });

  const submit = blessed.button({
    parent: form,
    bottom: 0,
    right: 18,
    width: 14,
    height: 3,
    content: '{center}{bold}SUBMIT{/bold}{/center}',
    tags: true,
    border: 'line',
    style: { 
      border: { fg: COLORS.success },
      hover: { bg: COLORS.success, fg: 'black' }, 
      focus: { bg: COLORS.success, fg: 'black' } 
    }
  });

  const cancel = blessed.button({
    parent: form,
    bottom: 0,
    right: 2,
    width: 14,
    height: 3,
    content: '{center}CANCEL{/center}',
    tags: true,
    border: 'line',
    style: { 
      border: { fg: COLORS.error },
      hover: { bg: COLORS.error, fg: 'black' }, 
      focus: { bg: COLORS.error, fg: 'black' } 
    }
  });

  aiDescButton.on('press', async () => {
    if (!titleInput.value) return;
    descInput.setValue('Generating...');
    screen.render();
    let fullText = '';
    await api.generateDescription(titleInput.value, (token) => {
      fullText += token;
      descInput.setValue(fullText);
      screen.render();
    });
  });

  aiRatioButton.on('press', async () => {
    if (!titleInput.value || !descInput.value) return;
    rationaleInput.setValue('Generating...');
    screen.render();
    let fullText = '';
    await api.generateRationale(titleInput.value, descInput.value, (token) => {
      fullText += token;
      rationaleInput.setValue(fullText);
      screen.render();
    });
  });

  submit.on('press', async () => {
    if (!titleInput.value) {
        const msg = blessed.message({ parent: screen, top: 'center', left: 'center', border: 'line' });
        msg.display('Title is required!', 2000, () => {});
        return;
    }
    try {
      await api.createRequirement({
        title: titleInput.value,
        description: descInput.value,
        rationale: rationaleInput.value,
        status: 'Draft',
        priority: 'Medium',
        project_id: selectedProjectId
      });
      form.destroy();
      refreshData();
      updateFocus();
    } catch (err) {
      const msg = blessed.message({ parent: screen, top: 'center', left: 'center', border: 'line', style: { border: { fg: 'red' } } });
      msg.display('Error creating requirement', 2000, () => {});
    }
  });

  const closeForm = () => {
    form.destroy();
    screen.render();
    updateFocus();
  };

  cancel.on('press', closeForm);
  form.on('reset', closeForm);
  form.key('escape', closeForm);

  // Focus management
  titleInput.focus();
  screen.render();
}

screen.key(['q', 'C-c'], showExitConfirmation);
screen.key(['r'], refreshData);
screen.key(['n'], showCreateForm);

refreshData();
updateFocus();
screen.render();
