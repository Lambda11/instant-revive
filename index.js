module.exports = function Instant_revive(mod) {
	const command = mod.command;
	let partyMembers = [],
		isDead = {};
	
	mod.game.initialize("me");
	
	command.add('irevive', {
		$none() {
			mod.settings.enabled = !mod.settings.enabled;
			command.message(`for Self: ${mod.settings.enabled ? 'En' : 'Dis'}abled`);
		},
		party() {
			mod.settings.party = !mod.settings.party;
			command.message(`for Party: ${mod.settings.party ? 'En' : 'Dis'}abled`);
		},
		drama() {
			mod.settings.drama = !mod.settings.drama;
			command.message(`Drama: ${mod.settings.drama ? 'En' : 'Dis'}abled`);
		}
	});
	
	mod.hook('S_CREATURE_LIFE', 3, {order: 9999}, ({gameId, alive, loc})=>{
		if(mod.settings.enabled)
		{
			const member = mod.settings.party ? (partyMembers.find((memb) => memb.gameId === gameId)) : null;
			if (!member && gameId !== mod.game.me.gameId) return;
			
			if(!alive)
			{
				isDead[gameId] = true;
				if(gameId === mod.game.me.gameId) { setTimeout(clearMyBuffs, 280);} // fix for bugged CC skills?
				if(mod.settings.drama)
				{
					setTimeout(fakeDeath, 300, gameId, loc, 0);
					setTimeout(fakeDeath, 5000, gameId, loc, 1);
				}
				else
				{
					fakeDeath(gameId, loc, 1);
					setTimeout(fakeDeath, 300, gameId, loc, 1); // in case player was moving\using skills during death
					setTimeout(fakeDeath, 2000, gameId, loc, 1);
					setTimeout(fakeDeath, 4000, gameId, loc, 1);
				}
				return false; // we wont't have to waste time reviving if we don't die
			}
			else
			{
				fakeDeathEnd(gameId, loc);
				isDead[gameId] = false;
			}
		}
	});
	
	mod.hook('S_PARTY_MEMBER_LIST', 9, ({members}) => {
		partyMembers = members;
	});
	
	mod.hook('S_LEAVE_PARTY_MEMBER', 2, ({playerId}) => {
		const mpos = partyMembers.findIndex((memb) => memb.playerId === playerId);
		if (mpos === -1) return;
		
		delete isDead[partyMembers[mpos].gameId];
		partyMembers.splice(mpos, 1);
	});
	
	mod.hook('S_LEAVE_PARTY', 'raw', () => {
		partyMembers.length = 0;
	})

	function fakeDeath(Id, Loc, Stage)
	{
		if(isDead[Id])
		{
			mod.send('S_ACTION_STAGE', 9, {	
				gameId: Id,
				templateId: 11006,
				speed: 1,
				projectileSpeed: 1,
				stage: Stage,
				id: 9999999,
				effectScale: 1,
				dest: Loc,
				loc: Loc,
				skill: {
					reserved: 0,
					npc: false,
					type: 1,
					huntingZoneId: 0,
					id: 70300
				}});
			if(Stage === 1)
			{
				mod.toClient('S_INSTANT_MOVE', 3, {
					gameId: Id,
					loc: Loc
				});
			}
		}
	}
	
	function fakeDeathEnd(Id, Loc)
	{
		mod.send('S_ACTION_END', 5, {	
			gameId: Id,
			templateId: 11006,
			type: 25,
			id: 9999999,
			loc: Loc,
			skill: {
				reserved: 0,
				npc: false,
				type: 1,
				huntingZoneId: 0,
				id: 70300
			}});
	}
	
	function clearMyBuffs()
	{
		if(mod.game.me.abnormalities && isDead[mod.game.me.gameId])
		{
			Object.values(mod.game.me.abnormalities).forEach(abnormality => {
				mod.toClient('S_ABNORMALITY_END', 1, {
					target: mod.game.me.gameId,
					id: abnormality.id
				});
				command.message("Cleared abnormality " + abnormality.id)
			});
		}
	}
}