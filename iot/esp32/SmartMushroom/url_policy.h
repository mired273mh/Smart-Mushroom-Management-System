#pragma once

// Plaintext dev mode accepts only literal RFC1918 IPv4 with optional port.
// Reject DNS suffixes, credentials and ambiguous leading-zero octets.
constexpr bool isPrivateHttpBase(const char *url) {
  const char *prefix = "http://";
  for (unsigned i=0;i<7;i++) if (url[i] != prefix[i]) return false;
  unsigned octets[4] = {};
  unsigned pos = 7;
  for (unsigned i=0;i<4;i++) {
    unsigned digits=0;
    const bool leadingZero=url[pos]=='0';
    while (url[pos]>='0' && url[pos]<='9') {
      if (++digits>3 || (leadingZero && digits>1)) return false;
      octets[i]=octets[i]*10+(url[pos++]-'0');
    }
    if (digits==0 || octets[i]>255) return false;
    if (i<3 && url[pos++]!='.') return false;
  }
  if (!(octets[0]==10 || (octets[0]==172 && octets[1]>=16 && octets[1]<=31) ||
        (octets[0]==192 && octets[1]==168))) return false;
  if (url[pos]==':') {
    unsigned port=0, digits=0;
    ++pos;
    while (url[pos]>='0' && url[pos]<='9') {
      if (++digits>5) return false;
      port=port*10+(url[pos++]-'0');
    }
    if (digits==0 || port==0 || port>65535) return false;
  }
  return url[pos]=='\0';
}

// Evaluated by the ESP32 compiler in both firmware modes; no GPIO/network use.
static_assert(isPrivateHttpBase("http://10.0.0.1:3000"));
static_assert(isPrivateHttpBase("http://192.168.1.10"));
static_assert(isPrivateHttpBase("http://172.16.0.1:1"));
static_assert(isPrivateHttpBase("http://172.31.255.254:65535"));
static_assert(!isPrivateHttpBase("http://10.evil.invalid"));
static_assert(!isPrivateHttpBase("http://192.168.1.1.evil.invalid"));
static_assert(!isPrivateHttpBase("http://10.0.0.1@evil.invalid"));
static_assert(!isPrivateHttpBase("http://10.0.0.999"));
static_assert(!isPrivateHttpBase("http://010.0.0.1"));
static_assert(!isPrivateHttpBase("http://172.15.0.1"));
static_assert(!isPrivateHttpBase("http://172.32.0.1"));
static_assert(!isPrivateHttpBase("http://8.8.8.8"));
static_assert(!isPrivateHttpBase("http://10.0.0.1:0"));
static_assert(!isPrivateHttpBase("http://10.0.0.1:65536"));
static_assert(!isPrivateHttpBase("http://10.0.0.1/path"));
static_assert(!isPrivateHttpBase("https://10.0.0.1"));
static_assert(!isPrivateHttpBase(""));
