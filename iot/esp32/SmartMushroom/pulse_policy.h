#pragma once
#include <stdint.h>

// Platform-independent policy. GPIO and HTTP stay outside this class.
class PulsePolicy {
  bool configured_, server_ = false, sensor_ = false;
  uint32_t contact_ = 0, sample_ = 0, started_[4] = {}, duration_[4] = {};
  uint8_t mask_ = 0;
public:
  constexpr explicit PulsePolicy(bool configured): configured_(configured) {}
  constexpr void contact(uint32_t now, bool approved) {contact_=now;server_=approved;if(!approved)mask_=0;}
  constexpr void sample(uint32_t now, bool valid) {sample_=now;sensor_=valid;if(!valid)mask_=0;}
  constexpr void disconnect() {server_=false;mask_=0;}
  constexpr uint8_t tick(uint32_t now) {
    if(!configured_||!server_||!sensor_||uint32_t(now-contact_)>=15000||uint32_t(now-sample_)>=30000)mask_=0;
    for(unsigned i=0;i<4;i++)if((mask_&(1u<<i))&&uint32_t(now-started_[i])>=duration_[i])mask_&=~(1u<<i);
    return mask_;
  }
  constexpr bool command(unsigned channel,bool enabled,unsigned seconds,uint32_t now) {
    tick(now);
    if(channel>=4||seconds<1||seconds>10)return false;
    if(!enabled){mask_&=~(1u<<channel);return true;}
    if(!configured_||!server_||!sensor_||uint32_t(now-contact_)>=15000||uint32_t(now-sample_)>=30000)return false;
    if(channel==3&&(mask_&2))return false; // ventilation has priority over heating
    if(channel==1)mask_&=~8u;
    // Refreshes/duplicate ON cannot stretch a currently active pulse.
    if(mask_&(1u<<channel))return false;
    started_[channel]=now;duration_[channel]=seconds*1000u;mask_|=1u<<channel;return true;
  }
};

constexpr bool pulsePolicySelfTest() {
  PulsePolicy locked(false);locked.contact(1,true);locked.sample(1,true);
  if(locked.command(0,true,1,1))return false;
  PulsePolicy p(true);
  if(p.command(0,true,1,0))return false;
  p.contact(100,true);p.sample(100,true);
  if(p.command(4,true,1,100)||p.command(0,true,11,100)||p.command(0,true,0,100))return false;
  if(!p.command(0,true,2,100)||p.tick(2099)!=1||p.command(0,true,10,2099)||p.tick(2100)!=0)return false;
  if(!p.command(3,true,10,2200)||!p.command(1,true,10,2200)||p.tick(2200)!=2||p.command(3,true,1,2200))return false;
  p.disconnect();if(p.tick(2201)!=0)return false;
  p.contact(3000,true);p.sample(3000,true);p.command(2,true,10,3000);
  p.sample(3001,false);if(p.tick(3001)!=0)return false;
  p.contact(4000,true);p.sample(4000,true);p.command(0,true,10,4000);
  p.contact(4001,false);if(p.tick(4001)!=0)return false;
  p.contact(0xfffffff0u,true);p.sample(0xfffffff0u,true);
  if(!p.command(0,true,1,0xfffffff0u)||p.tick(0x10u)!=1||p.tick(0x3d8u)!=0)return false;
  p.contact(1,true);p.sample(1,true);if(p.command(0,true,1,30001))return false;
  p.contact(100,true);p.sample(10000,true);p.command(0,true,10,10000);
  if(p.tick(15100)!=0)return false; // server contact expired before pulse deadline
  p.contact(30000,true);p.sample(1000,true);p.command(0,true,10,30000);
  if(p.tick(31000)!=0)return false; // sample expired while server remains fresh
  if(!p.command(0,false,1,31000))return false;
  return true;
}
static_assert(pulsePolicySelfTest(),"Pulse/interlock/freshness/rollover policy regression");
