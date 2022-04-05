# Effectful

PoC for new [Effection](https://github.com/thefrontside/effection) engine based
on delimited continuations and Algebraic Effects.

## How it works

Underneath there is a generalization of a tree of stateful Effects,
similar to the tree of tasks in structured cocurrency.  The difference
is that the effects are completely generalized. They do not need to
"do" anything like run a task. They are just computations that may or
may not end and that also have helpful metadata. The tree of Effects
governs what order computations may happen in and how they are set up
and destroyed. Then, the structured concurrency can be built on top of
this tree.
