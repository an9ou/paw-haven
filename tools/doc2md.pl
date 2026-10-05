#!/usr/bin/perl
# Convert a Claude Docs "view" read (JSON wrapper around <doc> XML) to Markdown.
use strict; use warnings; use JSON::PP;
binmode STDOUT, ':utf8';
local $/; my $raw = <>;
my $arr = JSON::PP->new->utf8->decode($raw);
my $txt = join '', map { $_->{text} // '' } @$arr;
$txt =~ s/^.*?(\{"verdict")/$1/s;
my $d = JSON::PP->new->decode($txt);
my $xml = $d->{data}{xml};

# tokenize
my @tok;
while ($xml =~ /\G(?:<!\[CDATA\[(.*?)\]\]>|<(\/?)([a-zA-Z]+)((?:\s+[a-zA-Z-]+='[^']*')*)\s*(\/?)>|([^<]+))/gcs) {
  if (defined $1) { push @tok, { t => "text", v => $1 }; next }
  if (defined $3) {
    my ($close, $name, $attrs, $self) = ($2, $3, $4, $5);
    my %a; while ($attrs =~ /([a-zA-Z-]+)='([^']*)'/g) { $a{$1} = ent($2) }
    push @tok, { t => $close ? 'close' : 'open', n => $name, a => \%a };
    push @tok, { t => 'close', n => $name } if $self;
  } else { push @tok, { t => 'text', v => ent($6) } }
}
sub ent { my $s = shift; $s =~ s/&lt;/</g; $s =~ s/&gt;/>/g; $s =~ s/&quot;/"/g; $s =~ s/&apos;/'/g; $s =~ s/&#39;/'/g; $s =~ s/&amp;/&/g; $s }

# build tree
my $root = { n => 'root', c => [] }; my @st = ($root);
for my $t (@tok) {
  if ($t->{t} eq 'open') { my $nd = { n => $t->{n}, a => $t->{a}, c => [] }; push @{$st[-1]{c}}, $nd; push @st, $nd }
  elsif ($t->{t} eq 'close') { pop @st if @st > 1 }
  else { push @{$st[-1]{c}}, { n => '#', v => $t->{v} } }
}

sub inline {
  my $nd = shift; my $o = '';
  for my $c (@{$nd->{c}}) {
    my $n = $c->{n};
    if ($n eq '#') { $o .= $c->{v} }
    elsif ($n eq 'bold') { my $i = inline($c); $o .= $i =~ /\S/ ? "**$i**" : $i }
    elsif ($n eq 'italic') { $o .= '*' . inline($c) . '*' }
    elsif ($n eq 'code') { $o .= '`' . inline($c) . '`' }
    elsif ($n eq 'link') { $o .= '[' . inline($c) . '](' . ($c->{a}{href} // $c->{a}{url} // '') . ')' }
    elsif ($n eq 'date') { $o .= $c->{a}{value} // '' }
    elsif ($n eq 'mention') { $o .= '@' . ($c->{a}{name} // 'someone') }
    elsif ($n eq 'embed') { $o .= '[embedded chart/diagram]' }
    elsif ($n eq 'break') { $o .= "  \n" }
    else { $o .= inline($c) }
  }
  $o;
}

sub block {
  my ($nd, $ind) = @_; my $o = '';
  for my $c (@{$nd->{c}}) {
    my $n = $c->{n};
    if ($n eq 'paragraph') {
      my $h = $c->{a}{heading}; my $t = inline($c);
      $o .= $ind . ($h ? ('#' x $h) . ' ' : '') . $t . "\n\n";
    } elsif ($n eq 'list') {
      my $k = $c->{a}{kind} // 'bullet'; my $i = 0;
      for my $li (@{$c->{c}}) {
        next unless $li->{n} eq 'listItem'; $i++;
        my $mark = $k eq 'ordered' ? "$i. " : $k eq 'task' ? (($li->{a}{checked} // '') eq 'true' ? '- [x] ' : '- [ ] ') : '- ';
        my $body = block($li, '');
        $body =~ s/\n\n+/\n/g; $body =~ s/\n$//;
        my @l = split /\n/, $body;
        my $first = shift(@l) // '';
        $o .= $ind . $mark . $first . "\n";
        $o .= $ind . '    ' . $_ . "\n" for @l;
      }
      $o .= "\n";
    } elsif ($n eq 'table') {
      my @rows = grep { $_->{n} eq 'row' } @{$c->{c}};
      my $first = 1;
      for my $r (@rows) {
        my @cells = map { my $x = block($_, ''); $x =~ s/\s*\n+\s*/ <br> /g; $x =~ s/(?: <br> )+$//; $x =~ s/\|/\\|/g; $x } grep { $_->{n} eq 'cell' } @{$r->{c}};
        $o .= $ind . '| ' . join(' | ', @cells) . " |\n";
        if ($first) { $o .= $ind . '|' . join('|', map { ' --- ' } @cells) . "|\n"; $first = 0 }
      }
      $o .= "\n";
    } elsif ($n eq 'codeBlock') {
      $o .= $ind . '```' . ($c->{a}{lang} // $c->{a}{language} // '') . "\n" . inline($c) . "\n```\n\n";
    } elsif ($n eq 'embed') {
      $o .= $ind . "*[Embedded chart/diagram - see the original doc]*\n\n";
    } elsif ($n eq '#') {
      $o .= $c->{v} if $c->{v} =~ /\S/;
    } else { $o .= block($c, $ind) }
  }
  $o;
}
my $out = block($root, '');
$out =~ s/\n{3,}/\n\n/g;
print $out;
