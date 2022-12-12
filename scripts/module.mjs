// GET MODULE CORE
import { MODULE } from './_module.mjs';

//import Proficiency from "./overrides/proficiency.js";

// DEFINE MODULE CLASS
export class SKILLRANKS {

	static getRankCount

	static renderActorSkillConfig = (app, element, options) => {
		let $element = $(element);
		MODULE.log(app, element, options)

		$element.find(`select[name="system.skills.${options.skillId}.value"]`).closest('.form-group').after(`<div class="form-group">
			<label>Skill Rank</label>
			<select name="flags.${MODULE.ID}.skills.${options.skillId}.rank">
				<option value="0">Untrained</option>
				<option value="2">Knowledgable</option>
				<option value="3">Trained</option>
				<option value="4">Expert</option>
				<option value="5">Master</option>
				<option value="6">Legendary</option>
			</select>
		</div>`);
		
		let rankLevel = app.object.flags[MODULE.ID]?.skills[options.skillId]?.rank ?? 0;
		if (options.skill.value > 0 && (rankLevel ?? 0) == 0) rankLevel = 2;	

		$element.find(`select[name="flags.${MODULE.ID}.skills.${options.skillId}.rank"]`).val(rankLevel);

		app.setPosition();
	}

	//actorData, bonusData, bonuses, checkBonus, originalSkills
	static prepareSkills(bonusData, globalBonuses, checkBonus, originalSkills) {
		MODULE.log('prepareSkills', this, bonusData, globalBonuses, checkBonus, originalSkills)
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
		  
		  let rankLevel = this.flags[MODULE.ID]?.skills[id]?.rank ?? 0;
		  if (skl.value > 0 && (rankLevel ?? 0) == 0) rankLevel = 2;		
		  MODULE.log('OVERRIDE', id, rankLevel, skl.value, roundDown)

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

	static renderActorSheet5e = (app, element, options) => {
		let $element = $(element);
		let rankData = {
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

		$element.find('.skills-list li.skill').each((index, skill) => {
			let skillData = options.actor.system.skills[skill.dataset.skill];
			let rankLevel = options.actor.flags[MODULE.ID]?.skills[skill.dataset.skill]?.rank ?? 0;
			if (skillData.value > 0 && (rankLevel ?? 0) == 0) rankLevel = 2;	

			MODULE.log('renderActorSheet5e', index, skillData);
			$(skill).find('.skill-name-controls').before(`<a class="rank-toggle skill-rank" data-tooltip="Rank: ${rankData[rankLevel].title}"><i class="far">${rankData[rankLevel].rank}</i></a>`);

			/*$(skill).find('.rank-toggle.skill-rank').on('click', (event) => {
				MODULE.log(event);
			})*/
		});
	}
}