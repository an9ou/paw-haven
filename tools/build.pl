#!/usr/bin/perl
# Perl twin of `node game/build.js publish`, for machines without Node.
# Writes paw_haven_prototype.html (single file, art + modules merged), byte-identical to the Node build
# (minus its `node --check` syntax check and banned-word check).
#   perl tools/build.pl
use strict; use warnings;
use FindBin; chdir "$FindBin::Bin/.." or die $!;
sub rd { my $f = shift; open my $h, '<:raw', $f or die "$f: $!"; local $/; my $s = <$h>; $s }
sub cat_dir { my $d = shift; join '', map { rd("game/$d/$_") } grep { length } map { s/^\s+|\s+$//gr } split /\n/, rd("game/$d/ORDER.txt") }
sub mod { my $s = rd(shift); die "</script in module\n" if $s =~ m{</script}i; $s }
my $out = rd('game/shell.html');
my $art  = join "\n", map { mod($_) } qw(dogs/pawart_dogs.js world/pawart_world_a.js world/pawart_world_b.js world/pawart_world_c.js);
my $mods = join "\n", map { mod($_) } qw(mods/genes.js mods/pawaudio.js mods/walkrun.js mods/toys.js mods/garden.js mods/kitchen.js);
for ([ '/*@@CSS@@*/', cat_dir('css') ], [ '/*@@GAME@@*/', cat_dir('src') ], [ '/*@@PAWART@@*/', $art ], [ '/*@@PAWMODS@@*/', $mods ]) {
  my $i = index($out, $_->[0]); die "missing slot $_->[0]\n" if $i < 0; substr($out, $i, length $_->[0]) = $_->[1];
}
open my $w, '>:raw', 'paw_haven_prototype.html' or die $!; print $w $out; close $w;
printf "publish build ok %.2f MB -> paw_haven_prototype.html\n", length($out) / 1e6;
