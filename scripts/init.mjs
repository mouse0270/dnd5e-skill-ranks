// GET MODULE CORE
import { MODULE } from './_module.mjs';

// IMPORT SETTINGS -> Settings Register on Hooks.Setup
import './_settings.mjs';

// GET CORE MODULE
import { SKILLRANKS } from './module.mjs';
import { libWrapper } from './libraries/lib-wrapper.shim.js';

/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
// socketlib HOOKS -> socketlib.ready
/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
Hooks.once('socketlib.ready', () => {
	MODULE.debug('SOCKETLIB Ready - SOCKET'); // WONT REGISTER CAUSE CALL HAPPENS WAY TO EARLY
	LOGIC.registerSocketLib();
});

/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
// 🧙 DEVELOPER MODE HOOKS -> devModeReady
/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag(MODULE.ID, 'level', {
		choiceLabelOverrides: {
			0: 'NONE',
			1: 'ERROR',
			2: 'WARN',
			3: 'DEBUG',
			4: 'INFO',
			5: 'ALL'
		}
	});
});

/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
// libWrapper HOOKS -> BIND HOOKS
/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
Hooks.on('init', async () => {
	// Update Prepare Skills to Handle for Skill Rank
	libWrapper.register(MODULE.ID, 'game.dnd5e.documents.Actor5e.prototype._prepareSkills', SKILLRANKS.prepareSkills, 'OVERRIDE');
	
	// Update Cycle Skill Proficiency
	libWrapper.register(MODULE.ID, 'game.dnd5e.applications.actor.ActorSheet5e.prototype._onCycleSkillProficiency', SKILLRANKS.onCycleSkillProficiency, 'OVERRIDE');
});

/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
// FOUNDRY HOOKS -> BIND HOOKS
/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
Hooks.on("renderActorSheet5e", SKILLRANKS.renderActorSheet5e);
Hooks.on("renderActorSkillConfig", SKILLRANKS.renderActorSkillConfig);