// GET MODULE CORE
import { MODULE } from './_module.mjs';

import Proficiency from "./overrides/proficiency.js";

// DEFINE MODULE CLASS
export class SKILLRANKS {

	static renderActorSkillConfig = (app, element, options) => {
		let $element = $(element);
		MODULE.log(app, element, options)

		$element.find(`select[name="data.skills.${options.skillId}.value"]`).closest('.form-group').after(`<div class="form-group">
			<label>Skill Rank</label>
			<select name="data.skills.${options.skillId}.rank">
				<option value="0">Untrained</option>
				<option value="2">Knowledgable</option>
				<option value="3">Trained</option>
				<option value="4">Expert</option>
				<option value="5">Master</option>
				<option value="6">Legendary</option>
			</select>
		</div>`);

		$element.find(`select[name="data.skills.${options.skillId}.rank"]`).val(options.skill.rank ?? 0);
	}

	static prepareSkills(actorData, bonusData, bonuses, checkBonus, originalSkills) {
		MODULE.log(actorData, bonusData, bonuses, checkBonus, originalSkills)
		if (actorData.type === "vehicle") return;

		const data = actorData.data;
		const flags = actorData.flags.dnd5e || {};

		// Skill modifiers
		const feats = CONFIG.DND5E.characterFlags;
		const joat = flags.jackOfAllTrades;
		const observant = flags.observantFeat;
		const skillBonus = this._simplifyBonus(bonuses.skill, bonusData);
		for (let [id, skl] of Object.entries(data.skills)) {
			skl.value = Math.clamped(Number(skl.value).toNearest(0.5), 0, 2) ?? 0;
			const baseBonus = this._simplifyBonus(skl.bonuses?.check, bonusData);
			let roundDown = true;

			// Remarkable Athlete
			if ( this._isRemarkableAthlete(skl.ability) && (skl.value < 0.5) ) {
				skl.value = 0.5;
				roundDown = false;
			}

			// Jack of All Trades
			else if ( joat && (skl.value < 0.5) ) {
				skl.value = 0.5;
			}

			// Polymorph Skill Proficiencies
			if ( originalSkills ) {
				skl.value = Math.max(skl.value, originalSkills[id].value);
			}

			// Compute modifier
			const checkBonusAbl = this._simplifyBonus(data.abilities[skl.ability]?.bonuses?.check, bonusData);
			skl.bonus = baseBonus + checkBonus + checkBonusAbl + skillBonus;
			skl.mod = data.abilities[skl.ability].mod;

			if (skl.value > 0 && (skl?.rank ?? 0) == 0) skl.rank = 2;
			
			MODULE.log('OVERRIDE', id, skl.rank, skl.value, roundDown)
			skl.prof = new Proficiency(skl.rank, skl.value, roundDown);

			skl.proficient = skl.value;
			skl.total = skl.mod + skl.bonus;
			if ( Number.isNumeric(skl.prof.term) ) skl.total += skl.prof.flat;

			// Compute passive bonus
			const passive = observant && (feats.observantFeat.skills.includes(id)) ? 5 : 0;
			const passiveBonus = this._simplifyBonus(skl.bonuses?.passive, bonusData);
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
			let skillData = options.actor.data.skills[skill.dataset.skill]
			MODULE.log(index, skillData);
			$(skill).find('.skill-name-controls').before(`<a class="rank-toggle skill-rank" title="Rank: ${rankData[skillData.rank ?? 0].title}"><i class="far">${rankData[skillData.rank ?? 0].rank}</i></a>`)
		});
	}
}