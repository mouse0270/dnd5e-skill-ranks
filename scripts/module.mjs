// GET MODULE CORE
import { MODULE } from './_module.mjs';

// DEFINE MODULE CLASS
export class SKILLRANKS {

	static getRankCount

	static get rank() {
		return {
			0: {
				rank: 0,
				title: 'untrained'
			},
			2: {
				rank: 1,
				title: 'Knowledgeable'
			},
			3: {
				rank: 2,
				title: 'Trained'
			},
			4: {
				rank: 3,
				title: 'Expert'
			},
			5: {
				rank: 4,
				title: 'Master'
			},
			6: {
				rank: 5,
				title: 'Legendary'
			}
		}
	}

	static renderActorSkillConfig = (app, element, options) => {
		let $element = $(element);
		$element.find(`select[name="system.skills.${options.skillId}.value"]`).closest('.form-group').after(`<div class="form-group">
			<label>Skill Rank</label>
			<select name="flags.${MODULE.ID}.${options.skillId}">
				<option value="0">Untrained</option>
				<option value="2">Knowledgable</option>
				<option value="3">Trained</option>
				<option value="4">Expert</option>
				<option value="5">Master</option>
				<option value="6">Legendary</option>
			</select>
		</div>`);
		
		let rankLevel = app.object.flags[MODULE.ID]?.[options.skillId] ?? 0;
		if (options.skill.value > 0 && (rankLevel ?? 0) == 0) rankLevel = 2;	

		$element.find(`select[name="flags.${MODULE.ID}.${options.skillId}"]`).val(rankLevel);

		app.setPosition();
	}

	//actorData, bonusData, bonuses, checkBonus, originalSkills
	static prepareSkills(bonusData, globalBonuses, checkBonus, originalSkills) {
		if ( this.type === "vehicle" ) return;
		const flags = this.flags.dnd5e ?? {};

		// Skill modifiers
		const feats = CONFIG.DND5E.characterFlags;
		const skillBonus = dnd5e.utils.simplifyBonus(globalBonuses.skill, bonusData);
		for ( const [id, skl] of Object.entries(this.system.skills) ) {
		  const ability = this.system.abilities[skl.ability];
		  skl.value = Math.clamped(Number(skl.value).toNearest(0.5), 0, 2) ?? 0;
		  const baseBonus = dnd5e.utils.simplifyBonus(skl.bonuses?.check, bonusData);
		  let roundDown = true;
	
		  // Remarkable Athlete
		  if ( this._isRemarkableAthlete(skl.ability) && (skl.value < 0.5) ) {
			skl.value = 0.5;
			roundDown = false;
		  }
	
		  // Jack of All Trades
		  else if ( flags.jackOfAllTrades && (skl.value < 0.5) ) {
			skl.value = 0.5;
		  }
	
		  // Polymorph Skill Proficiencies
		  if ( originalSkills ) {
			skl.value = Math.max(skl.value, originalSkills[id].value);
		  }
	
		  // Compute modifier
		  const checkBonusAbl = dnd5e.utils.simplifyBonus(ability?.bonuses?.check, bonusData);
		  skl.bonus = baseBonus + checkBonus + checkBonusAbl + skillBonus;
		  skl.mod = ability?.mod ?? 0;
		  
		  let rankLevel = this.flags[MODULE.ID]?.[id] ?? 0;
		  if (skl.value > 0 && (rankLevel ?? 0) == 0) rankLevel = 2;

		  //skl.prof = new Proficiency(skl.rank, skl.value, roundDown);
		  skl.prof = new game.dnd5e.documents.Proficiency(rankLevel, skl.value, roundDown);
		  skl.proficient = skl.value;
		  skl.total = skl.mod + skl.bonus;
		  if ( Number.isNumeric(skl.prof.term) ) skl.total += skl.prof.flat;
	
		  // Compute passive bonus
		  const passive = flags.observantFeat && (feats.observantFeat.skills.includes(id)) ? 5 : 0;
		  const passiveBonus = dnd5e.utils.simplifyBonus(skl.bonuses?.passive, bonusData);
		  skl.passive = 10 + skl.mod + skl.bonus + skl.prof.flat + passive + passiveBonus;
		}
	}

	static onCycleSkillRank(event) {
		event.preventDefault();
		const field = event.target.closest('.skill').querySelector('input');
		const skillName = event.target.closest('.skill').dataset.skill;
		const actorId = event.target.closest('.window-app').getAttribute('id').split('-').pop();
		const actor = game.actors.get(actorId);
		const skillData = actor._source.system.skills[skillName];
		if ( !actor ) return;
		let rankLevel = actor.flags[MODULE.ID]?.[skillName] ?? 0;
		if (rankLevel == 1) rankLevel = 0;
		if (skillData.value > 0 && (rankLevel ?? 0) == 0) rankLevel = 2;

		const getNext = (lvl, mod) => {
			if (skillData.value == 0) {
				if (mod == 1 && lvl == 6) return 0;
				else if (mod == 1 && lvl == 0) return 2;
				else if (mod == -1 && lvl == 0) return 6;
				else if (mod == -1 && lvl == 2) return 0;
			}else if (skillData.value != 0) {
				if (mod == 1 && lvl == 6) return 2;
				else if (mod == -1 && lvl == 2) return 6;
			}
			
			return lvl + mod;
		}

		actor.update({
			flags: {
				[MODULE.ID]: {
					[skillName]: getNext(parseInt(rankLevel), (event.type === "click" ? 1 : -1))
				} 
			}
		})
	}

	static onCycleSkillProficiency(event) {
		event.preventDefault();
		const field = event.currentTarget.previousElementSibling;
		const skillName = field.parentElement.dataset.skill;
		const source = this.actor._source.system.skills[skillName];
		if ( !source ) return;
		const rankLevel = this.actor.flags[MODULE.ID]?.[skillName] ?? 0;

		const getNext = (arr, idx, mod) => arr?.[idx + mod] ? idx + mod : (mod == 1 ? 0 : arr.length - 1); 
	
		// Cycle to the next or previous skill level
		const levels = rankLevel == 0 ? [0, 1, 0.5, 2] : [1, 0.5, 2];
		let idx = levels.indexOf(source?.value ?? 0); 
		if (idx == -1) idx = 0;
		const next = getNext(levels, idx, (event.type === "click" ? 1 : -1));
		field.value = levels[next];
	
		// Update the field value and save the form
		return this._onSubmit(event);
	}

	static renderActorSheet5e = (app, element, options) => {
		let $element = $(element);

		$element.find('.skills-list li.skill').each((index, skill) => {
			let skillData = options.actor.system.skills[skill.dataset.skill];
			let rankLevel = options.actor.flags[MODULE.ID]?.[skill.dataset.skill] ?? 0;
			if (rankLevel == 1) rankLevel = 0;
			if (skillData.value > 0 && (rankLevel ?? 0) == 0) rankLevel = 2;

			$(skill).find('.skill-name-controls').before(`<a class="rank-toggle skill-rank" data-tooltip="Rank: ${SKILLRANKS.rank[rankLevel].title}"><i class="far">${SKILLRANKS.rank[rankLevel].rank}</i></a>`);

			$(skill).find('.rank-toggle.skill-rank').on('click contextmenu', SKILLRANKS.onCycleSkillRank);
		});
	}
}