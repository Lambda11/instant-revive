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
			if (!mod.settings.party)
			{
				partyMembers.length = 0;
				command.message(`If you enable it again later while you are in a party - you will need to rejoin your party after that for this to work again`);
			}
		},
		drama() {
			mod.settings.drama = !mod.settings.drama;
			command.message(`Drama: ${mod.settings.drama ? 'En' : 'Dis'}abled`);
		}
	});
	
	mod.hook('S_CREATURE_LIFE', 3, {order: 9999}, ({gameId, alive, loc})=>{
		if(mod.settings.enabled)
		{
			const member = partyMembers.find((memb) => memb.gameId === gameId);
			if (!member && gameId !== mod.game.me.gameId) return;
			
			if(!alive)
			{
				isDead[gameId] = true;
				setTimeout(moveBody, 299, gameId, loc); // not sure if helps at all
				if(mod.settings.drama)
				{
					setTimeout(fakeDeath, 300, gameId, loc, 0);
					setTimeout(fakeDeath, 5000, gameId, loc, 1);
				}
				else
				{
					setTimeout(fakeDeath, 300, gameId, loc, 1);
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
	
	mod.hook('S_PARTY_MEMBER_LIST', 7, ({members}) => {
		if (!mod.settings.party) return;
		
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
	
	function moveBody(Id, Loc)
	{
		mod.send('S_USER_LOCATION', 5, {	
			gameId: Id,
			loc: Loc,
			speed: 250,
			dest: Loc,
			type: 7
		});
	}
}