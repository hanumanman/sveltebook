here is the alert sequence on mobile browser:
(initially state: suspended)

start

context resumed early

context state after early resume: running

start fetching

res fetched

reader created

reader readed (chunk #1)

audio buffer decoded

audio buffer pushed

reader readed (chunk #2)

reader done true, value undefined

Stream processing completed with 1 audio chunks

reader lock released

audio data getted

About to play buffer with duration: 1.776 seconds, channels: 1, sampleRate: 48000

source created

buffer assigned to source

gain node created

source connected through gain node

Buffer has audio data: true, max sample: 0.7119013

context resumed again

final context state: running

starting playback now

source.start() called --> But no audio is played here, I cant hear any sound!

context time after start: 0.008

pants shitted

-> At this point, there are no more alert, but no audio is played.
