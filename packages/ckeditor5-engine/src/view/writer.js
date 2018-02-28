/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module module:engine/view/writer
 */

import Position from './position';
import ContainerElement from './containerelement';
import AttributeElement from './attributeelement';
import EmptyElement from './emptyelement';
import UIElement from './uielement';
import Range from './range';
import CKEditorError from '@ckeditor/ckeditor5-utils/src/ckeditorerror';
import DocumentFragment from './documentfragment';
import isIterable from '@ckeditor/ckeditor5-utils/src/isiterable';
import isPlainObject from '@ckeditor/ckeditor5-utils/src/lib/lodash/isPlainObject';
import Text from './text';
import EditableElement from './editableelement';

/**
 * View writer class. Provides set of methods used to properly manipulate nodes attached to
 * {@link module:engine/view/document~Document view document}. It is not recommended to use it directly. To get an instance
 * of view writer associated with the document use {@link module:engine/view/view~View#change view.change()) method.
 */
export default class Writer {
	constructor( document ) {
		this.document = document;
	}

	/**
	 * Sets {@link module:engine/view/selection~Selection selection's} ranges and direction to the specified location based on the given
	 * {@link module:engine/view/selection~Selection selection}, {@link module:engine/view/position~Position position},
	 * {@link module:engine/view/item~Item item}, {@link module:engine/view/range~Range range},
	 * an iterable of {@link module:engine/view/range~Range ranges} or null.
	 *
	 * This method provides option to create a fake selection.
	 * Fake selection does not render as browser native selection over selected elements and is hidden to the user.
	 * This way, no native selection UI artifacts are displayed to the user and selection over elements can be
	 * represented in other way, for example by applying proper CSS class.
	 *
	 * Additionally fake's selection label can be provided. It will be used to describe fake selection in DOM (and be
	 * properly handled by screen readers).
	 *
	 * Usage:
	 *
	 *		// Sets selection to the given range.
	 *		const range = new Range( start, end );
	 *		writer.setSelection( range, { backward, fake, label } );
	 *
	 *		// Sets selection to given ranges.
	 * 		const ranges = [ new Range( start1, end2 ), new Range( star2, end2 ) ];
	 *		writer.setSelection( range, { backward, fake, label } );
	 *
	 *		// Sets selection to the other selection.
	 *		const otherSelection = new Selection();
	 *		writer.setSelection( otherSelection );
	 *
	 * 		// Sets collapsed selection at the given position.
	 *		const position = new Position( root, path );
	 *		writer.setSelection( position, { fake, label } );
	 *
	 * 		// Sets collapsed selection at the position of given item and offset.
	 *		selection.setTo( paragraph, offset, { fake, label } );
	 *
	 *		// Sets selection inside the item.
	 *		selection.setTo( paragraph, 'in', { backward, fake, label } );
	 *
	 *		// Sets selection on the item.
	 *		selection.setTo( paragraph, 'on', { backward, fake, label } );
	 *
	 * 		// Removes all ranges.
	 *		writer.setSelection( null );
	 *
	 * @param {module:engine/view/selection~Selection|module:engine/view/position~Position|
	 * Iterable.<module:engine/view/range~Range>|module:engine/view/range~Range|module:engine/view/item~Item|null} selectable
	 * @param {Number|'before'|'end'|'after'|'on'|'in'} [placeOrOffset] Sets offset or place of the selection.
	 * @param {Object} [options]
	 * @param {Boolean} [options.backward] Sets this selection instance to be backward.
	 * @param {Boolean} [options.fake] Sets this selection instance to be marked as `fake`.
	 * @param {String} [options.label] Label for the fake selection.
	 */
	setSelection( selectable, placeOrOffset, options ) {
		this.document.selection._setTo( selectable, placeOrOffset, options );
	}

	/**
	 * Moves {@link module:engine/view/selection~Selection#focus selection's focus} to the specified location.
	 *
	 * The location can be specified in the same form as {@link module:engine/view/position~Position.createAt} parameters.
	 *
	 * @param {module:engine/view/item~Item|module:engine/view/position~Position} itemOrPosition
	 * @param {Number|'end'|'before'|'after'} [offset=0] Offset or one of the flags. Used only when
	 * first parameter is a {@link module:engine/view/item~Item view item}.
	 */
	setSelectionFocus( itemOrPosition, offset ) {
		this.document.selection._setFocus( itemOrPosition, offset );
	}

	/**
	 * Creates a new {@link module:engine/view/text~Text text node}.
	 *
	 *		writer.createText( 'foo' );
	 *
	 * @param {String} data Text data.
	 * @returns {module:engine/view/text~Text} Created text node.
	 */
	createText( data ) {
		return new Text( data );
	}

	/**
	 * Creates new {@link module:engine/view/attributeelement~AttributeElement}.
	 *
	 *		writer.createAttributeElement( 'strong' );
	 *		writer.createAttributeElement( 'strong', { 'alignment': 'center' } );
	 *
	 * @param {String} name Name of the element.
	 * @param {Object} [attributes] Elements attributes.
	 * @returns {module:engine/view/attributeelement~AttributeElement} Created element.
	 */
	createAttributeElement( name, attributes, priority ) {
		const attributeElement = new AttributeElement( name, attributes );

		if ( priority ) {
			attributeElement._priority = priority;
		}

		return attributeElement;
	}

	/**
	 * Creates new {@link module:engine/view/containerelement~ContainerElement}.
	 *
	 *		writer.createContainerElement( 'paragraph' );
	 *		writer.createContainerElement( 'paragraph', { 'alignment': 'center' } );
	 *
	 * @param {String} name Name of the element.
	 * @param {Object} [attributes] Elements attributes.
	 * @returns {module:engine/view/containerelement~ContainerElement} Created element.
	 */
	createContainerElement( name, attributes ) {
		return new ContainerElement( name, attributes );
	}

	/**
	 * Creates new {@link module:engine/view/editableelement~EditableElement}.
	 *
	 *		writer.createEditableElement( document, 'div' );
	 *		writer.createEditableElement( document, 'div', { 'alignment': 'center' } );
	 *
	 * @param {module:engine/view/document~Document} document View document.
	 * @param {String} name Name of the element.
	 * @param {Object} [attributes] Elements attributes.
	 * @returns {module:engine/view/editableelement~EditableElement} Created element.
	 */
	createEditableElement( name, attributes ) {
		const editableElement = new EditableElement( name, attributes );
		editableElement._document = this.document;

		return editableElement;
	}

	/**
	 * Creates new {@link module:engine/view/emptyelement~EmptyElement}.
	 *
	 *		writer.createEmptyElement( 'img' );
	 *		writer.createEmptyElement( 'img', { 'alignment': 'center' } );
	 *
	 * @param {String} name Name of the element.
	 * @param {Object} [attributes] Elements attributes.
	 * @returns {module:engine/view/emptyelement~EmptyElement} Created element.
	 */
	createEmptyElement( name, attributes ) {
		return new EmptyElement( name, attributes );
	}

	/**
	 * Creates new {@link module:engine/view/uielement~UIElement}.
	 *
	 *		writer.createUIElement( 'span' );
	 *		writer.createUIElement( 'span', { 'alignment': 'center' } );
	 *
	 * Custom render function can be provided as third parameter:
	 *
	 *		writer.createUIElement( 'span', null, function( domDocument ) {
	 *			const domElement = this.toDomElement( domDocument );
	 *			domElement.innerHTML = '<b>this is ui element</b>';
	 *
	 *			return domElement;
	 *		} );
	 *
	 * @param {String} name Name of the element.
	 * @param {Object} [attributes] Elements attributes.
	 * @param {Function} [renderFunction] Custom render function.
	 * @returns {module:engine/view/uielement~UIElement} Created element.
	 */
	createUIElement( name, attributes, renderFunction ) {
		const uiElement = new UIElement( name, attributes );

		if ( renderFunction ) {
			uiElement.render = renderFunction;
		}

		return uiElement;
	}

	/**
	 * Adds or overwrite element's attribute with a specified key and value.
	 *
	 *		writer.setAttribute( 'href', 'http://ckeditor.com', linkElement );
	 *
	 * @param {String} key Attribute key.
	 * @param {String} value Attribute value.
	 * @param {module:engine/view/element~Element} element
	 */
	setAttribute( key, value, element ) {
		element._setAttribute( key, value );
	}

	/**
	 * Removes attribute from the element.
	 *
	 *		writer.removeAttribute( 'href', linkElement );
	 *
	 * @param {String} key Attribute key.
	 * @param {module:engine/view/element~Element} element
	 */
	removeAttribute( key, element ) {
		element._removeAttribute( key );
	}

	/**
	 * Adds specified class to the element.
	 *
	 *		writer.addClass( 'foo', linkElement );
	 *		writer.addClass( [ 'foo', 'bar' ], linkElement );
	 *
	 * @param {Array.<String>|String} className
	 * @param {module:engine/view/element~Element} element
	 */
	addClass( className, element ) {
		element._addClass( className );
	}

	/**
	 * Removes specified class from the element.
	 *
	 *		writer.removeClass( 'foo', linkElement );
	 *		writer.removeClass( [ 'foo', 'bar' ], linkElement );
	 *
	 * @param {Array.<String>|String} className
	 * @param {module:engine/view/element~Element} element
	 */
	removeClass( className, element ) {
		element._removeClass( className );
	}

	/**
	 * Adds style to the element.
	 *
	 *		writer.setStyle( 'color', 'red', element );
	 *		writer.setStyle( {
	 *			color: 'red',
	 *			position: 'fixed'
	 *		}, element );
	 *
	 * @param {String|Object} property Property name or object with key - value pairs.
	 * @param {String} [value] Value to set. This parameter is ignored if object is provided as the first parameter.
	 * @param {module:engine/view/element~Element} element Element to set styles on.
	 */
	setStyle( property, value, element ) {
		if ( isPlainObject( property ) && element === undefined ) {
			element = value;
		}

		element._setStyle( property, value );
	}

	/**
	 * Removes specified style from the element.
	 *
	 *		writer.removeStyle( 'color', element );  // Removes 'color' style.
	 *		writer.removeStyle( [ 'color', 'border-top' ], element ); // Removes both 'color' and 'border-top' styles.
	 *
	 * @param {Array.<String>|String} property
	 * @param {module:engine/view/element~Element} element
	 */
	removeStyle( property, element ) {
		element._removeStyle( property );
	}

	/**
	 * Sets a custom property on element. Unlike attributes, custom properties are not rendered to the DOM,
	 * so they can be used to add special data to elements.
	 *
	 * @param {String|Symbol} key
	 * @param {*} value
	 * @param {module:engine/view/element~Element} element
	 */
	setCustomProperty( key, value, element ) {
		element._setCustomProperty( key, value );
	}

	/**
	 * Removes a custom property stored under the given key.
	 *
	 * @param {String|Symbol} key
	 * @param {module:engine/view/element~Element} element
	 * @returns {Boolean} Returns true if property was removed.
	 */
	removeCustomProperty( key, element ) {
		return element._removeCustomProperty( key );
	}

	/**
	 * Breaks attribute nodes at provided position or at boundaries of provided range. It breaks attribute elements inside
	 * up to a container element.
	 *
	 * In following examples `<p>` is a container, `<b>` and `<u>` are attribute nodes:
	 *
	 *        <p>foo<b><u>bar{}</u></b></p> -> <p>foo<b><u>bar</u></b>[]</p>
	 *        <p>foo<b><u>{}bar</u></b></p> -> <p>foo{}<b><u>bar</u></b></p>
	 *        <p>foo<b><u>b{}ar</u></b></p> -> <p>foo<b><u>b</u></b>[]<b><u>ar</u></b></p>
	 *        <p><b>fo{o</b><u>ba}r</u></p> -> <p><b>fo</b><b>o</b><u>ba</u><u>r</u></b></p>
	 *
	 * **Note:** {@link module:engine/view/documentfragment~DocumentFragment DocumentFragment} is treated like a container.
	 *
	 * **Note:** Difference between {@link module:engine/view/writer~Writer#breakAttributes breakAttributes} and
	 * {@link module:engine/view/writer~Writer#breakContainer breakContainer} is that `breakAttributes` breaks all
	 * {@link module:engine/view/attributeelement~AttributeElement attribute elements} that are ancestors of given `position`,
	 * up to the first encountered {@link module:engine/view/containerelement~ContainerElement container element}.
	 * `breakContainer` assumes that given `position` is directly in container element and breaks that container element.
	 *
	 * Throws {@link module:utils/ckeditorerror~CKEditorError CKEditorError} `view-writer-invalid-range-container`
	 * when {@link module:engine/view/range~Range#start start}
	 * and {@link module:engine/view/range~Range#end end} positions of a passed range are not placed inside same parent container.
	 *
	 * Throws {@link module:utils/ckeditorerror~CKEditorError CKEditorError} `view-writer-cannot-break-empty-element`
	 * when trying to break attributes
	 * inside {@link module:engine/view/emptyelement~EmptyElement EmptyElement}.
	 *
	 * Throws {@link module:utils/ckeditorerror~CKEditorError CKEditorError} `view-writer-cannot-break-ui-element`
	 * when trying to break attributes
	 * inside {@link module:engine/view/uielement~UIElement UIElement}.
	 *
	 * @see module:engine/view/attributeelement~AttributeElement
	 * @see module:engine/view/containerelement~ContainerElement
	 * @see module:engine/view/writer~Writer#breakContainer
	 * @param {module:engine/view/position~Position|module:engine/view/range~Range} positionOrRange Position where
	 * to break attribute elements.
	 * @returns {module:engine/view/position~Position|module:engine/view/range~Range} New position or range, after breaking the attribute
	 * elements.
	 */
	breakAttributes( positionOrRange ) {
		if ( positionOrRange instanceof Position ) {
			return _breakAttributes( positionOrRange );
		} else {
			return _breakAttributesRange( positionOrRange );
		}
	}

	/**
	 * Breaks {@link module:engine/view/containerelement~ContainerElement container view element} into two, at the given position. Position
	 * has to be directly inside container element and cannot be in root. Does not break if position is at the beginning
	 * or at the end of it's parent element.
	 *
	 *        <p>foo^bar</p> -> <p>foo</p><p>bar</p>
	 *        <div><p>foo</p>^<p>bar</p></div> -> <div><p>foo</p></div><div><p>bar</p></div>
	 *        <p>^foobar</p> -> ^<p>foobar</p>
	 *        <p>foobar^</p> -> <p>foobar</p>^
	 *
	 * **Note:** Difference between {@link module:engine/view/writer~Writer#breakAttributes breakAttributes} and
	 * {@link module:engine/view/writer~Writer#breakContainer breakContainer} is that `breakAttributes` breaks all
	 * {@link module:engine/view/attributeelement~AttributeElement attribute elements} that are ancestors of given `position`,
	 * up to the first encountered {@link module:engine/view/containerelement~ContainerElement container element}.
	 * `breakContainer` assumes that given `position` is directly in container element and breaks that container element.
	 *
	 * @see module:engine/view/attributeelement~AttributeElement
	 * @see module:engine/view/containerelement~ContainerElement
	 * @see module:engine/view/writer~Writer#breakAttributes
	 * @param {module:engine/view/position~Position} position Position where to break element.
	 * @returns {module:engine/view/position~Position} Position between broken elements. If element has not been broken,
	 * the returned position is placed either before it or after it.
	 */
	breakContainer( position ) {
		const element = position.parent;

		if ( !( element.is( 'containerElement' ) ) ) {
			/**
			 * Trying to break an element which is not a container element.
			 *
			 * @error view-writer-break-non-container-element
			 */
			throw new CKEditorError(
				'view-writer-break-non-container-element: Trying to break an element which is not a container element.'
			);
		}

		if ( !element.parent ) {
			/**
			 * Trying to break root element.
			 *
			 * @error view-writer-break-root
			 */
			throw new CKEditorError( 'view-writer-break-root: Trying to break root element.' );
		}

		if ( position.isAtStart ) {
			return Position.createBefore( element );
		} else if ( !position.isAtEnd ) {
			const newElement = element.clone( false );

			this.insert( Position.createAfter( element ), newElement );

			const sourceRange = new Range( position, Position.createAt( element, 'end' ) );
			const targetPosition = new Position( newElement, 0 );

			this.move( sourceRange, targetPosition );
		}

		return Position.createAfter( element );
	}

	/**
	 * Merges {@link module:engine/view/attributeelement~AttributeElement attribute elements}. It also merges text nodes if needed.
	 * Only {@link module:engine/view/attributeelement~AttributeElement#isSimilar similar} attribute elements can be merged.
	 *
	 * In following examples `<p>` is a container and `<b>` is an attribute element:
	 *
	 *        <p>foo[]bar</p> -> <p>foo{}bar</p>
	 *        <p><b>foo</b>[]<b>bar</b></p> -> <p><b>foo{}bar</b></p>
	 *        <p><b foo="bar">a</b>[]<b foo="baz">b</b></p> -> <p><b foo="bar">a</b>[]<b foo="baz">b</b></p>
	 *
	 * It will also take care about empty attributes when merging:
	 *
	 *        <p><b>[]</b></p> -> <p>[]</p>
	 *        <p><b>foo</b><i>[]</i><b>bar</b></p> -> <p><b>foo{}bar</b></p>
	 *
	 * **Note:** Difference between {@link module:engine/view/writer~Writer#mergeAttributes mergeAttributes} and
	 * {@link module:engine/view/writer~Writer#mergeContainers mergeContainers} is that `mergeAttributes` merges two
	 * {@link module:engine/view/attributeelement~AttributeElement attribute elements} or {@link module:engine/view/text~Text text nodes}
	 * while `mergeContainer` merges two {@link module:engine/view/containerelement~ContainerElement container elements}.
	 *
	 * @see module:engine/view/attributeelement~AttributeElement
	 * @see module:engine/view/containerelement~ContainerElement
	 * @see module:engine/view/writer~Writer#mergeContainers
	 * @param {module:engine/view/position~Position} position Merge position.
	 * @returns {module:engine/view/position~Position} Position after merge.
	 */
	mergeAttributes( position ) {
		const positionOffset = position.offset;
		const positionParent = position.parent;

		// When inside text node - nothing to merge.
		if ( positionParent.is( 'text' ) ) {
			return position;
		}

		// When inside empty attribute - remove it.
		if ( positionParent.is( 'attributeElement' ) && positionParent.childCount === 0 ) {
			const parent = positionParent.parent;
			const offset = positionParent.index;
			positionParent.remove();

			return this.mergeAttributes( new Position( parent, offset ) );
		}

		const nodeBefore = positionParent.getChild( positionOffset - 1 );
		const nodeAfter = positionParent.getChild( positionOffset );

		// Position should be placed between two nodes.
		if ( !nodeBefore || !nodeAfter ) {
			return position;
		}

		// When position is between two text nodes.
		if ( nodeBefore.is( 'text' ) && nodeAfter.is( 'text' ) ) {
			return mergeTextNodes( nodeBefore, nodeAfter );
		}
		// When selection is between two same attribute elements.
		else if ( nodeBefore.is( 'attributeElement' ) && nodeAfter.is( 'attributeElement' ) && nodeBefore.isSimilar( nodeAfter ) ) {
			// Move all children nodes from node placed after selection and remove that node.
			const count = nodeBefore.childCount;
			nodeBefore.appendChildren( nodeAfter.getChildren() );
			nodeAfter.remove();

			// New position is located inside the first node, before new nodes.
			// Call this method recursively to merge again if needed.
			return this.mergeAttributes( new Position( nodeBefore, count ) );
		}

		return position;
	}

	/**
	 * Merges two {@link module:engine/view/containerelement~ContainerElement container elements} that are before and after given position.
	 * Precisely, the element after the position is removed and it's contents are moved to element before the position.
	 *
	 *        <p>foo</p>^<p>bar</p> -> <p>foo^bar</p>
	 *        <div>foo</div>^<p>bar</p> -> <div>foo^bar</div>
	 *
	 * **Note:** Difference between {@link module:engine/view/writer~Writer#mergeAttributes mergeAttributes} and
	 * {@link module:engine/view/writer~Writer#mergeContainers mergeContainers} is that `mergeAttributes` merges two
	 * {@link module:engine/view/attributeelement~AttributeElement attribute elements} or {@link module:engine/view/text~Text text nodes}
	 * while `mergeContainer` merges two {@link module:engine/view/containerelement~ContainerElement container elements}.
	 *
	 * @see module:engine/view/attributeelement~AttributeElement
	 * @see module:engine/view/containerelement~ContainerElement
	 * @see module:engine/view/writer~Writer#mergeAttributes
	 * @param {module:engine/view/position~Position} position Merge position.
	 * @returns {module:engine/view/position~Position} Position after merge.
	 */
	mergeContainers( position ) {
		const prev = position.nodeBefore;
		const next = position.nodeAfter;

		if ( !prev || !next || !prev.is( 'containerElement' ) || !next.is( 'containerElement' ) ) {
			/**
			 * Element before and after given position cannot be merged.
			 *
			 * @error view-writer-merge-containers-invalid-position
			 */
			throw new CKEditorError( 'view-writer-merge-containers-invalid-position: ' +
				'Element before and after given position cannot be merged.' );
		}

		const lastChild = prev.getChild( prev.childCount - 1 );
		const newPosition = lastChild instanceof Text ? Position.createAt( lastChild, 'end' ) : Position.createAt( prev, 'end' );

		this.move( Range.createIn( next ), Position.createAt( prev, 'end' ) );
		this.remove( Range.createOn( next ) );

		return newPosition;
	}

	/**
	 * Insert node or nodes at specified position. Takes care about breaking attributes before insertion
	 * and merging them afterwards.
	 *
	 * Throws {@link module:utils/ckeditorerror~CKEditorError CKEditorError} `view-writer-insert-invalid-node` when nodes to insert
	 * contains instances that are not {@link module:engine/view/text~Text Texts},
	 * {@link module:engine/view/attributeelement~AttributeElement AttributeElements},
	 * {@link module:engine/view/containerelement~ContainerElement ContainerElements},
	 * {@link module:engine/view/emptyelement~EmptyElement EmptyElements} or
	 * {@link module:engine/view/uielement~UIElement UIElements}.
	 *
	 * @param {module:engine/view/position~Position} position Insertion position.
	 * @param {module:engine/view/text~Text|module:engine/view/attributeelement~AttributeElement|
	 * module:engine/view/containerelement~ContainerElement|module:engine/view/emptyelement~EmptyElement|
	 * module:engine/view/uielement~UIElement|Iterable.<module:engine/view/text~Text|
	 * module:engine/view/attributeelement~AttributeElement|module:engine/view/containerelement~ContainerElement|
	 * module:engine/view/emptyelement~EmptyElement|module:engine/view/uielement~UIElement>} nodes Node or nodes to insert.
	 * @returns {module:engine/view/range~Range} Range around inserted nodes.
	 */
	insert( position, nodes ) {
		nodes = isIterable( nodes ) ? [ ...nodes ] : [ nodes ];

		// Check if nodes to insert are instances of AttributeElements, ContainerElements, EmptyElements, UIElements or Text.
		validateNodesToInsert( nodes );

		const container = getParentContainer( position );

		if ( !container ) {
			/**
			 * Position's parent container cannot be found.
			 *
			 * @error view-writer-invalid-position-container
			 */
			throw new CKEditorError( 'view-writer-invalid-position-container' );
		}

		const insertionPosition = _breakAttributes( position, true );

		const length = container.insertChildren( insertionPosition.offset, nodes );
		const endPosition = insertionPosition.getShiftedBy( length );
		const start = this.mergeAttributes( insertionPosition );

		// When no nodes were inserted - return collapsed range.
		if ( length === 0 ) {
			return new Range( start, start );
		} else {
			// If start position was merged - move end position.
			if ( !start.isEqual( insertionPosition ) ) {
				endPosition.offset--;
			}

			const end = this.mergeAttributes( endPosition );

			return new Range( start, end );
		}
	}

	/**
	 * Removes provided range from the container.
	 *
	 * Throws {@link module:utils/ckeditorerror~CKEditorError CKEditorError} `view-writer-invalid-range-container` when
	 * {@link module:engine/view/range~Range#start start} and {@link module:engine/view/range~Range#end end} positions are not placed inside
	 * same parent container.
	 *
	 * @param {module:engine/view/range~Range} range Range to remove from container. After removing, it will be updated
	 * to a collapsed range showing the new position.
	 * @returns {module:engine/view/documentfragment~DocumentFragment} Document fragment containing removed nodes.
	 */
	remove( range ) {
		validateRangeContainer( range );

		// If range is collapsed - nothing to remove.
		if ( range.isCollapsed ) {
			return new DocumentFragment();
		}

		// Break attributes at range start and end.
		const { start: breakStart, end: breakEnd } = _breakAttributesRange( range, true );
		const parentContainer = breakStart.parent;

		const count = breakEnd.offset - breakStart.offset;

		// Remove nodes in range.
		const removed = parentContainer.removeChildren( breakStart.offset, count );

		// Merge after removing.
		const mergePosition = this.mergeAttributes( breakStart );
		range.start = mergePosition;
		range.end = Position.createFromPosition( mergePosition );

		// Return removed nodes.
		return new DocumentFragment( removed );
	}

	/**
	 * Removes matching elements from given range.
	 *
	 * Throws {@link module:utils/ckeditorerror~CKEditorError CKEditorError} `view-writer-invalid-range-container` when
	 * {@link module:engine/view/range~Range#start start} and {@link module:engine/view/range~Range#end end} positions are not placed inside
	 * same parent container.
	 *
	 * @param {module:engine/view/range~Range} range Range to clear.
	 * @param {module:engine/view/element~Element} element Element to remove.
	 */
	clear( range, element ) {
		validateRangeContainer( range );

		// Create walker on given range.
		// We walk backward because when we remove element during walk it modifies range end position.
		const walker = range.getWalker( {
			direction: 'backward',
			ignoreElementEnd: true
		} );

		// Let's walk.
		for ( const current of walker ) {
			const item = current.item;
			let rangeToRemove;

			// When current item matches to the given element.
			if ( item.is( 'element' ) && element.isSimilar( item ) ) {
				// Create range on this element.
				rangeToRemove = Range.createOn( item );
				// When range starts inside Text or TextProxy element.
			} else if ( !current.nextPosition.isAfter( range.start ) && item.is( 'textProxy' ) ) {
				// We need to check if parent of this text matches to given element.
				const parentElement = item.getAncestors().find( ancestor => {
					return ancestor.is( 'element' ) && element.isSimilar( ancestor );
				} );

				// If it is then create range inside this element.
				if ( parentElement ) {
					rangeToRemove = Range.createIn( parentElement );
				}
			}

			// If we have found element to remove.
			if ( rangeToRemove ) {
				// We need to check if element range stick out of the given range and truncate if it is.
				if ( rangeToRemove.end.isAfter( range.end ) ) {
					rangeToRemove.end = range.end;
				}

				if ( rangeToRemove.start.isBefore( range.start ) ) {
					rangeToRemove.start = range.start;
				}

				// At the end we remove range with found element.
				this.remove( rangeToRemove );
			}
		}
	}

	/**
	 * Moves nodes from provided range to target position.
	 *
	 * Throws {@link module:utils/ckeditorerror~CKEditorError CKEditorError} `view-writer-invalid-range-container` when
	 * {@link module:engine/view/range~Range#start start} and {@link module:engine/view/range~Range#end end} positions are not placed inside
	 * same parent container.
	 *
	 * @param {module:engine/view/range~Range} sourceRange Range containing nodes to move.
	 * @param {module:engine/view/position~Position} targetPosition Position to insert.
	 * @returns {module:engine/view/range~Range} Range in target container. Inserted nodes are placed between
	 * {@link module:engine/view/range~Range#start start} and {@link module:engine/view/range~Range#end end} positions.
	 */
	move( sourceRange, targetPosition ) {
		let nodes;

		if ( targetPosition.isAfter( sourceRange.end ) ) {
			targetPosition = _breakAttributes( targetPosition, true );

			const parent = targetPosition.parent;
			const countBefore = parent.childCount;

			sourceRange = _breakAttributesRange( sourceRange, true );

			nodes = this.remove( sourceRange );

			targetPosition.offset += ( parent.childCount - countBefore );
		} else {
			nodes = this.remove( sourceRange );
		}

		return this.insert( targetPosition, nodes );
	}

	/**
     * Wraps elements within range with provided {@link module:engine/view/attributeelement~AttributeElement AttributeElement}.
     * If a collapsed range is provided, it will be wrapped only if it is equal to view selection.
     *
     * If a collapsed range was passed and is same as selection, the selection
     * will be moved to the inside of the wrapped attribute element.
     *
     * Throws {@link module:utils/ckeditorerror~CKEditorError} `view-writer-invalid-range-container`
     * when {@link module:engine/view/range~Range#start}
     * and {@link module:engine/view/range~Range#end} positions are not placed inside same parent container.
     *
     * Throws {@link module:utils/ckeditorerror~CKEditorError} `view-writer-wrap-invalid-attribute` when passed attribute element is not
     * an instance of {module:engine/view/attributeelement~AttributeElement AttributeElement}.
     *
     * Throws {@link module:utils/ckeditorerror~CKEditorError} `view-writer-wrap-nonselection-collapsed-range` when passed range
     * is collapsed and different than view selection.
     *
     * @param {module:engine/view/range~Range} range Range to wrap.
     * @param {module:engine/view/attributeelement~AttributeElement} attribute Attribute element to use as wrapper.
     * @returns {module:engine/view/range~Range} range Range after wrapping, spanning over wrapping attribute element.
    */
	wrap( range, attribute ) {
		if ( !( attribute instanceof AttributeElement ) ) {
			throw new CKEditorError( 'view-writer-wrap-invalid-attribute' );
		}

		validateRangeContainer( range );

		if ( !range.isCollapsed ) {
			// Non-collapsed range. Wrap it with the attribute element.
			return this._wrapRange( range, attribute );
		} else {
			// Collapsed range. Wrap position.
			let position = range.start;

			if ( position.parent.is( 'element' ) && !_hasNonUiChildren( position.parent ) ) {
				position = position.getLastMatchingPosition( value => value.item.is( 'uiElement' ) );
			}

			position = this._wrapPosition( position, attribute );
			const viewSelection = this.document.selection;

			// If wrapping position is equal to view selection, move view selection inside wrapping attribute element.
			if ( viewSelection.isCollapsed && viewSelection.getFirstPosition().isEqual( range.start ) ) {
				this.setSelection( position );
			}

			return new Range( position );
		}
	}

	/**
	 * Unwraps nodes within provided range from attribute element.
	 *
	 * Throws {@link module:utils/ckeditorerror~CKEditorError CKEditorError} `view-writer-invalid-range-container` when
	 * {@link module:engine/view/range~Range#start start} and {@link module:engine/view/range~Range#end end} positions are not placed inside
	 * same parent container.
	 *
	 * @param {module:engine/view/range~Range} range
	 * @param {module:engine/view/attributeelement~AttributeElement} attribute
	 */
	unwrap( range, attribute ) {
		if ( !( attribute instanceof AttributeElement ) ) {
			/**
			 * Attribute element need to be instance of attribute element.
			 *
			 * @error view-writer-unwrap-invalid-attribute
			 */
			throw new CKEditorError( 'view-writer-unwrap-invalid-attribute' );
		}

		validateRangeContainer( range );

		// If range is collapsed - nothing to unwrap.
		if ( range.isCollapsed ) {
			return range;
		}

		// Break attributes at range start and end.
		const { start: breakStart, end: breakEnd } = _breakAttributesRange( range, true );

		// Range around one element - check if AttributeElement can be unwrapped partially when it's not similar.
		// For example:
		// <b class="foo bar" title="baz"></b> unwrap with:	<b class="foo"></p> result: <b class"bar" title="baz"></b>
		if ( breakEnd.isEqual( breakStart.getShiftedBy( 1 ) ) ) {
			const node = breakStart.nodeAfter;

			// Unwrap single attribute element.
			if ( !attribute.isSimilar( node ) && node instanceof AttributeElement && this._unwrapAttributeElement( attribute, node ) ) {
				const start = this.mergeAttributes( breakStart );

				if ( !start.isEqual( breakStart ) ) {
					breakEnd.offset--;
				}

				const end = this.mergeAttributes( breakEnd );

				return new Range( start, end );
			}
		}

		const parentContainer = breakStart.parent;

		// Unwrap children located between break points.
		const newRange = this._unwrapChildren( parentContainer, breakStart.offset, breakEnd.offset, attribute );

		// Merge attributes at the both ends and return a new range.
		const start = this.mergeAttributes( newRange.start );

		// If start position was merged - move end position back.
		if ( !start.isEqual( newRange.start ) ) {
			newRange.end.offset--;
		}

		const end = this.mergeAttributes( newRange.end );

		return new Range( start, end );
	}

	/**
	 * Renames element by creating a copy of renamed element but with changed name and then moving contents of the
	 * old element to the new one. Keep in mind that this will invalidate all {@link module:engine/view/position~Position positions} which
	 * has renamed element as {@link module:engine/view/position~Position#parent a parent}.
	 *
	 * New element has to be created because `Element#tagName` property in DOM is readonly.
	 *
	 * Since this function creates a new element and removes the given one, the new element is returned to keep reference.
	 *
	 * @param {module:engine/view/containerelement~ContainerElement} viewElement Element to be renamed.
	 * @param {String} newName New name for element.
	 */
	rename( viewElement, newName ) {
		const newElement = new ContainerElement( newName, viewElement.getAttributes() );

		this.insert( Position.createAfter( viewElement ), newElement );
		this.move( Range.createIn( viewElement ), Position.createAt( newElement ) );
		this.remove( Range.createOn( viewElement ) );

		return newElement;
	}

	/**
	 * Wraps children with provided `attribute`. Only children contained in `parent` element between
	 * `startOffset` and `endOffset` will be wrapped.
	 *
	 * @private
	 * @param {module:engine/view/element~Element} parent
	 * @param {Number} startOffset
	 * @param {Number} endOffset
	 * @param {module:engine/view/element~Element} attribute
	 */
	_wrapChildren( parent, startOffset, endOffset, attribute ) {
		let i = startOffset;
		const wrapPositions = [];

		while ( i < endOffset ) {
			const child = parent.getChild( i );
			const isText = child.is( 'text' );
			const isAttribute = child.is( 'attributeElement' );
			const isEmpty = child.is( 'emptyElement' );
			const isUI = child.is( 'uiElement' );

			// Wrap text, empty elements, ui elements or attributes with higher or equal priority.
			if ( isText || isEmpty || isUI || ( isAttribute && shouldABeOutsideB( attribute, child ) ) ) {
				// Clone attribute.
				const newAttribute = attribute.clone();

				// Wrap current node with new attribute;
				child.remove();
				newAttribute.appendChildren( child );
				parent.insertChildren( i, newAttribute );

				wrapPositions.push(	new Position( parent, i ) );
			}
			// If other nested attribute is found start wrapping there.
			else if ( isAttribute ) {
				this._wrapChildren( child, 0, child.childCount, attribute );
			}

			i++;
		}

		// Merge at each wrap.
		let offsetChange = 0;

		for ( const position of wrapPositions ) {
			position.offset -= offsetChange;

			// Do not merge with elements outside selected children.
			if ( position.offset == startOffset ) {
				continue;
			}

			const newPosition = this.mergeAttributes( position );

			// If nodes were merged - other merge offsets will change.
			if ( !newPosition.isEqual( position ) ) {
				offsetChange++;
				endOffset--;
			}
		}

		return Range.createFromParentsAndOffsets( parent, startOffset, parent, endOffset );
	}

	/**
	 * Unwraps children from provided `attribute`. Only children contained in `parent` element between
	 * `startOffset` and `endOffset` will be unwrapped.
	 *
	 * @private
	 * @param {module:engine/view/element~Element} parent
	 * @param {Number} startOffset
	 * @param {Number} endOffset
	 * @param {module:engine/view/element~Element} attribute
	 */
	_unwrapChildren( parent, startOffset, endOffset, attribute ) {
		let i = startOffset;
		const unwrapPositions = [];

		// Iterate over each element between provided offsets inside parent.
		while ( i < endOffset ) {
			const child = parent.getChild( i );

			// If attributes are the similar, then unwrap.
			if ( child.isSimilar( attribute ) ) {
				const unwrapped = child.getChildren();
				const count = child.childCount;

				// Replace wrapper element with its children
				child.remove();
				parent.insertChildren( i, unwrapped );

				// Save start and end position of moved items.
				unwrapPositions.push(
					new Position( parent, i ),
					new Position( parent, i + count )
				);

				// Skip elements that were unwrapped. Assuming that there won't be another element to unwrap in child
				// elements.
				i += count;
				endOffset += count - 1;
			} else {
				// If other nested attribute is found start unwrapping there.
				if ( child.is( 'attributeElement' ) ) {
					this._unwrapChildren( child, 0, child.childCount, attribute );
				}

				i++;
			}
		}

		// Merge at each unwrap.
		let offsetChange = 0;

		for ( const position of unwrapPositions ) {
			position.offset -= offsetChange;

			// Do not merge with elements outside selected children.
			if ( position.offset == startOffset || position.offset == endOffset ) {
				continue;
			}

			const newPosition = this.mergeAttributes( position );

			// If nodes were merged - other merge offsets will change.
			if ( !newPosition.isEqual( position ) ) {
				offsetChange++;
				endOffset--;
			}
		}

		return Range.createFromParentsAndOffsets( parent, startOffset, parent, endOffset );
	}

	/**
	 * Helper function for `view.writer.wrap`. Wraps range with provided attribute element.
	 * This method will also merge newly added attribute element with its siblings whenever possible.
	 *
	 * Throws {@link module:utils/ckeditorerror~CKEditorError} `view-writer-wrap-invalid-attribute` when passed attribute element is not
	 * an instance of {module:engine/view/attributeelement~AttributeElement AttributeElement}.
	 *
	 * @private
	 * @param {module:engine/view/range~Range} range
	 * @param {module:engine/view/attributeelement~AttributeElement} attribute
	 * @returns {module:engine/view/range~Range} New range after wrapping, spanning over wrapping attribute element.
	 */
	_wrapRange( range, attribute ) {
		// Range is inside single attribute and spans on all children.
		if ( rangeSpansOnAllChildren( range ) && this._wrapAttributeElement( attribute, range.start.parent ) ) {
			const parent = range.start.parent;

			const end = this.mergeAttributes( Position.createAfter( parent ) );
			const start = this.mergeAttributes( Position.createBefore( parent ) );

			return new Range( start, end );
		}

		// Break attributes at range start and end.
		const { start: breakStart, end: breakEnd } = _breakAttributesRange( range, true );

		// Range around one element.
		if ( breakEnd.isEqual( breakStart.getShiftedBy( 1 ) ) ) {
			const node = breakStart.nodeAfter;

			if ( node instanceof AttributeElement && this._wrapAttributeElement( attribute, node ) ) {
				const start = this.mergeAttributes( breakStart );

				if ( !start.isEqual( breakStart ) ) {
					breakEnd.offset--;
				}

				const end = this.mergeAttributes( breakEnd );

				return new Range( start, end );
			}
		}

		const parentContainer = breakStart.parent;

		// Unwrap children located between break points.
		const unwrappedRange = this._unwrapChildren( parentContainer, breakStart.offset, breakEnd.offset, attribute );

		// Wrap all children with attribute.
		const newRange = this._wrapChildren( parentContainer, unwrappedRange.start.offset, unwrappedRange.end.offset, attribute );

		// Merge attributes at the both ends and return a new range.
		const start = this.mergeAttributes( newRange.start );

		// If start position was merged - move end position back.
		if ( !start.isEqual( newRange.start ) ) {
			newRange.end.offset--;
		}
		const end = this.mergeAttributes( newRange.end );

		return new Range( start, end );
	}

	/**
	 * Helper function for {@link #wrap}. Wraps position with provided attribute element.
	 * This method will also merge newly added attribute element with its siblings whenever possible.
	 *
	 * Throws {@link module:utils/ckeditorerror~CKEditorError} `view-writer-wrap-invalid-attribute` when passed attribute element is not
	 * an instance of {module:engine/view/attributeelement~AttributeElement AttributeElement}.
	 *
	 * @private
	 * @param {module:engine/view/position~Position} position
	 * @param {module:engine/view/attributeelement~AttributeElement} attribute
	 * @returns {module:engine/view/position~Position} New position after wrapping.
	 */
	_wrapPosition( position, attribute ) {
		// Return same position when trying to wrap with attribute similar to position parent.
		if ( attribute.isSimilar( position.parent ) ) {
			return movePositionToTextNode( Position.createFromPosition( position ) );
		}

		// When position is inside text node - break it and place new position between two text nodes.
		if ( position.parent.is( 'text' ) ) {
			position = breakTextNode( position );
		}

		// Create fake element that will represent position, and will not be merged with other attributes.
		const fakePosition = this.createAttributeElement();
		fakePosition._priority = Number.POSITIVE_INFINITY;
		fakePosition.isSimilar = () => false;

		// Insert fake element in position location.
		position.parent.insertChildren( position.offset, fakePosition );

		// Range around inserted fake attribute element.
		const wrapRange = new Range( position, position.getShiftedBy( 1 ) );

		// Wrap fake element with attribute (it will also merge if possible).
		this.wrap( wrapRange, attribute );

		// Remove fake element and place new position there.
		const newPosition = new Position( fakePosition.parent, fakePosition.index );
		fakePosition.remove();

		// If position is placed between text nodes - merge them and return position inside.
		const nodeBefore = newPosition.nodeBefore;
		const nodeAfter = newPosition.nodeAfter;

		if ( nodeBefore instanceof Text && nodeAfter instanceof Text ) {
			return mergeTextNodes( nodeBefore, nodeAfter );
		}

		// If position is next to text node - move position inside.
		return movePositionToTextNode( newPosition );
	}

	/**
	 * 	Wraps one {@link module:engine/view/attributeelement~AttributeElement AttributeElement} into another by
	 * 	merging them if possible. When merging is possible - all attributes, styles and classes are moved from wrapper
	 * 	element to element being wrapped.
	 *
	 * 	@private
	 * 	@param {module:engine/view/attributeelement~AttributeElement} wrapper Wrapper AttributeElement.
	 * 	@param {module:engine/view/attributeelement~AttributeElement} toWrap AttributeElement to wrap using wrapper element.
	 * 	@returns {Boolean} Returns `true` if elements are merged.
	 */
	_wrapAttributeElement( wrapper, toWrap ) {
		// Can't merge if name or priority differs.
		if ( wrapper.name !== toWrap.name || wrapper.priority !== toWrap.priority ) {
			return false;
		}

		// Check if attributes can be merged.
		for ( const key of wrapper.getAttributeKeys() ) {
			// Classes and styles should be checked separately.
			if ( key === 'class' || key === 'style' ) {
				continue;
			}

			// If some attributes are different we cannot wrap.
			if ( toWrap.hasAttribute( key ) && toWrap.getAttribute( key ) !== wrapper.getAttribute( key ) ) {
				return false;
			}
		}

		// Check if styles can be merged.
		for ( const key of wrapper.getStyleNames() ) {
			if ( toWrap.hasStyle( key ) && toWrap.getStyle( key ) !== wrapper.getStyle( key ) ) {
				return false;
			}
		}

		// Move all attributes/classes/styles from wrapper to wrapped AttributeElement.
		for ( const key of wrapper.getAttributeKeys() ) {
			// Classes and styles should be checked separately.
			if ( key === 'class' || key === 'style' ) {
				continue;
			}

			// Move only these attributes that are not present - other are similar.
			if ( !toWrap.hasAttribute( key ) ) {
				this.setAttribute( key, wrapper.getAttribute( key ), toWrap );
			}
		}

		for ( const key of wrapper.getStyleNames() ) {
			if ( !toWrap.hasStyle( key ) ) {
				this.setStyle( key, wrapper.getStyle( key ), toWrap );
			}
		}

		for ( const key of wrapper.getClassNames() ) {
			if ( !toWrap.hasClass( key ) ) {
				this.addClass( key, toWrap );
			}
		}

		return true;
	}

	/**
	 * Unwraps {@link module:engine/view/attributeelement~AttributeElement AttributeElement} from another by removing
	 * corresponding attributes, classes and styles. All attributes, classes and styles from wrapper should be present
	 * inside element being unwrapped.
	 *
	 * @private
	 * @param {module:engine/view/attributeelement~AttributeElement} wrapper Wrapper AttributeElement.
	 * @param {module:engine/view/attributeelement~AttributeElement} toUnwrap AttributeElement to unwrap using wrapper element.
	 * @returns {Boolean} Returns `true` if elements are unwrapped.
	 **/
	_unwrapAttributeElement( wrapper, toUnwrap ) {
		// Can't unwrap if name or priority differs.
		if ( wrapper.name !== toUnwrap.name || wrapper.priority !== toUnwrap.priority ) {
			return false;
		}

		// Check if AttributeElement has all wrapper attributes.
		for ( const key of wrapper.getAttributeKeys() ) {
			// Classes and styles should be checked separately.
			if ( key === 'class' || key === 'style' ) {
				continue;
			}

			// If some attributes are missing or different we cannot unwrap.
			if ( !toUnwrap.hasAttribute( key ) || toUnwrap.getAttribute( key ) !== wrapper.getAttribute( key ) ) {
				return false;
			}
		}

		// Check if AttributeElement has all wrapper classes.
		if ( !toUnwrap.hasClass( ...wrapper.getClassNames() ) ) {
			return false;
		}

		// Check if AttributeElement has all wrapper styles.
		for ( const key of wrapper.getStyleNames() ) {
			// If some styles are missing or different we cannot unwrap.
			if ( !toUnwrap.hasStyle( key ) || toUnwrap.getStyle( key ) !== wrapper.getStyle( key ) ) {
				return false;
			}
		}

		// Remove all wrapper's attributes from unwrapped element.
		for ( const key of wrapper.getAttributeKeys() ) {
			// Classes and styles should be checked separately.
			if ( key === 'class' || key === 'style' ) {
				continue;
			}

			this.removeAttribute( key, toUnwrap );
		}

		// Remove all wrapper's classes from unwrapped element.
		this.removeClass( Array.from( wrapper.getClassNames() ), toUnwrap );

		// Remove all wrapper's styles from unwrapped element.
		this.removeStyle( Array.from( wrapper.getStyleNames() ), toUnwrap );

		return true;
	}
}

// Helper function for `view.writer.wrap`. Checks if given element has any children that are not ui elements.
function _hasNonUiChildren( parent ) {
	return Array.from( parent.getChildren() ).some( child => !child.is( 'uiElement' ) );
}

/**
 * Attribute element need to be instance of attribute element.
 *
 * @error view-writer-wrap-invalid-attribute
 */

// Returns first parent container of specified {@link module:engine/view/position~Position Position}.
// Position's parent node is checked as first, then next parents are checked.
// Note that {@link module:engine/view/documentfragment~DocumentFragment DocumentFragment} is treated like a container.
//
// @param {module:engine/view/position~Position} position Position used as a start point to locate parent container.
// @returns {module:engine/view/containerelement~ContainerElement|module:engine/view/documentfragment~DocumentFragment|undefined}
// Parent container element or `undefined` if container is not found.
function getParentContainer( position ) {
	let parent = position.parent;

	while ( !isContainerOrFragment( parent ) ) {
		if ( !parent ) {
			return undefined;
		}
		parent = parent.parent;
	}

	return parent;
}

// Function used by both public breakAttributes (without splitting text nodes) and by other methods (with
// splitting text nodes).
//
// @param {module:engine/view/range~Range} range Range which `start` and `end` positions will be used to break attributes.
// @param {Boolean} [forceSplitText = false] If set to `true`, will break text nodes even if they are directly in
// container element. This behavior will result in incorrect view state, but is needed by other view writing methods
// which then fixes view state. Defaults to `false`.
// @returns {module:engine/view/range~Range} New range with located at break positions.
function _breakAttributesRange( range, forceSplitText = false ) {
	const rangeStart = range.start;
	const rangeEnd = range.end;

	validateRangeContainer( range );

	// Break at the collapsed position. Return new collapsed range.
	if ( range.isCollapsed ) {
		const position = _breakAttributes( range.start, forceSplitText );

		return new Range( position, position );
	}

	const breakEnd = _breakAttributes( rangeEnd, forceSplitText );
	const count = breakEnd.parent.childCount;
	const breakStart = _breakAttributes( rangeStart, forceSplitText );

	// Calculate new break end offset.
	breakEnd.offset += breakEnd.parent.childCount - count;

	return new Range( breakStart, breakEnd );
}

// Function used by public breakAttributes (without splitting text nodes) and by other methods (with
// splitting text nodes).
//
// Throws {@link module:utils/ckeditorerror~CKEditorError CKEditorError} `view-writer-cannot-break-empty-element` when break position
// is placed inside {@link module:engine/view/emptyelement~EmptyElement EmptyElement}.
//
// Throws {@link module:utils/ckeditorerror~CKEditorError CKEditorError} `view-writer-cannot-break-ui-element` when break position
// is placed inside {@link module:engine/view/uielement~UIElement UIElement}.
//
// @param {module:engine/view/position~Position} position Position where to break attributes.
// @param {Boolean} [forceSplitText = false] If set to `true`, will break text nodes even if they are directly in
// container element. This behavior will result in incorrect view state, but is needed by other view writing methods
// which then fixes view state. Defaults to `false`.
// @returns {module:engine/view/position~Position} New position after breaking the attributes.
function _breakAttributes( position, forceSplitText = false ) {
	const positionOffset = position.offset;
	const positionParent = position.parent;

	// If position is placed inside EmptyElement - throw an exception as we cannot break inside.
	if ( position.parent.is( 'emptyElement' ) ) {
		/**
		 * Cannot break inside EmptyElement instance.
		 *
		 * @error view-writer-cannot-break-empty-element
		 */
		throw new CKEditorError( 'view-writer-cannot-break-empty-element' );
	}

	// If position is placed inside UIElement - throw an exception as we cannot break inside.
	if ( position.parent.is( 'uiElement' ) ) {
		/**
		 * Cannot break inside UIElement instance.
		 *
		 * @error view-writer-cannot-break-ui-element
		 */
		throw new CKEditorError( 'view-writer-cannot-break-ui-element' );
	}

	// There are no attributes to break and text nodes breaking is not forced.
	if ( !forceSplitText && positionParent.is( 'text' ) && isContainerOrFragment( positionParent.parent ) ) {
		return Position.createFromPosition( position );
	}

	// Position's parent is container, so no attributes to break.
	if ( isContainerOrFragment( positionParent ) ) {
		return Position.createFromPosition( position );
	}

	// Break text and start again in new position.
	if ( positionParent.is( 'text' ) ) {
		return _breakAttributes( breakTextNode( position ), forceSplitText );
	}

	const length = positionParent.childCount;

	// <p>foo<b><u>bar{}</u></b></p>
	// <p>foo<b><u>bar</u>[]</b></p>
	// <p>foo<b><u>bar</u></b>[]</p>
	if ( positionOffset == length ) {
		const newPosition = new Position( positionParent.parent, positionParent.index + 1 );

		return _breakAttributes( newPosition, forceSplitText );
	} else
	// <p>foo<b><u>{}bar</u></b></p>
	// <p>foo<b>[]<u>bar</u></b></p>
	// <p>foo{}<b><u>bar</u></b></p>
	if ( positionOffset === 0 ) {
		const newPosition = new Position( positionParent.parent, positionParent.index );

		return _breakAttributes( newPosition, forceSplitText );
	}
	// <p>foo<b><u>b{}ar</u></b></p>
	// <p>foo<b><u>b[]ar</u></b></p>
	// <p>foo<b><u>b</u>[]<u>ar</u></b></p>
	// <p>foo<b><u>b</u></b>[]<b><u>ar</u></b></p>
	else {
		const offsetAfter = positionParent.index + 1;

		// Break element.
		const clonedNode = positionParent.clone();

		// Insert cloned node to position's parent node.
		positionParent.parent.insertChildren( offsetAfter, clonedNode );

		// Get nodes to move.
		const count = positionParent.childCount - positionOffset;
		const nodesToMove = positionParent.removeChildren( positionOffset, count );

		// Move nodes to cloned node.
		clonedNode.appendChildren( nodesToMove );

		// Create new position to work on.
		const newPosition = new Position( positionParent.parent, offsetAfter );

		return _breakAttributes( newPosition, forceSplitText );
	}
}

// Checks if first {@link module:engine/view/attributeelement~AttributeElement AttributeElement} provided to the function
// can be wrapped otuside second element. It is done by comparing elements'
// {@link module:engine/view/attributeelement~AttributeElement#priority priorities}, if both have same priority
// {@link module:engine/view/element~Element#getIdentity identities} are compared.
//
// @param {module:engine/view/attributeelement~AttributeElement} a
// @param {module:engine/view/attributeelement~AttributeElement} b
// @returns {Boolean}
function shouldABeOutsideB( a, b ) {
	if ( a.priority < b.priority ) {
		return true;
	} else if ( a.priority > b.priority ) {
		return false;
	}

	// When priorities are equal and names are different - use identities.
	return a.getIdentity() < b.getIdentity();
}

// Returns new position that is moved to near text node. Returns same position if there is no text node before of after
// specified position.
//
//		<p>foo[]</p>  ->  <p>foo{}</p>
//		<p>[]foo</p>  ->  <p>{}foo</p>
//
// @param {module:engine/view/position~Position} position
// @returns {module:engine/view/position~Position} Position located inside text node or same position if there is no text nodes
// before or after position location.
function movePositionToTextNode( position ) {
	const nodeBefore = position.nodeBefore;

	if ( nodeBefore && nodeBefore.is( 'text' ) ) {
		return new Position( nodeBefore, nodeBefore.data.length );
	}

	const nodeAfter = position.nodeAfter;

	if ( nodeAfter && nodeAfter.is( 'text' ) ) {
		return new Position( nodeAfter, 0 );
	}

	return position;
}

// Breaks text node into two text nodes when possible.
//
//		<p>foo{}bar</p> -> <p>foo[]bar</p>
//		<p>{}foobar</p> -> <p>[]foobar</p>
//		<p>foobar{}</p> -> <p>foobar[]</p>
//
// @param {module:engine/view/position~Position} position Position that need to be placed inside text node.
// @returns {module:engine/view/position~Position} New position after breaking text node.
function breakTextNode( position ) {
	if ( position.offset == position.parent.data.length ) {
		return new Position( position.parent.parent, position.parent.index + 1 );
	}

	if ( position.offset === 0 ) {
		return new Position( position.parent.parent, position.parent.index );
	}

	// Get part of the text that need to be moved.
	const textToMove = position.parent.data.slice( position.offset );

	// Leave rest of the text in position's parent.
	position.parent.data = position.parent.data.slice( 0, position.offset );

	// Insert new text node after position's parent text node.
	position.parent.parent.insertChildren( position.parent.index + 1, new Text( textToMove ) );

	// Return new position between two newly created text nodes.
	return new Position( position.parent.parent, position.parent.index + 1 );
}

// Merges two text nodes into first node. Removes second node and returns merge position.
//
// @param {module:engine/view/text~Text} t1 First text node to merge. Data from second text node will be moved at the end of
// this text node.
// @param {module:engine/view/text~Text} t2 Second text node to merge. This node will be removed after merging.
// @returns {module:engine/view/position~Position} Position after merging text nodes.
function mergeTextNodes( t1, t2 ) {
	// Merge text data into first text node and remove second one.
	const nodeBeforeLength = t1.data.length;
	t1.data += t2.data;
	t2.remove();

	return new Position( t1, nodeBeforeLength );
}

// Returns `true` if range is located in same {@link module:engine/view/attributeelement~AttributeElement AttributeElement}
// (`start` and `end` positions are located inside same {@link module:engine/view/attributeelement~AttributeElement AttributeElement}),
// starts on 0 offset and ends after last child node.
//
// @param {module:engine/view/range~Range} Range
// @returns {Boolean}
function rangeSpansOnAllChildren( range ) {
	return range.start.parent == range.end.parent && range.start.parent.is( 'attributeElement' ) &&
		range.start.offset === 0 && range.end.offset === range.start.parent.childCount;
}

// Checks if provided nodes are valid to insert. Checks if each node is an instance of
// {@link module:engine/view/text~Text Text} or {@link module:engine/view/attributeelement~AttributeElement AttributeElement},
// {@link module:engine/view/containerelement~ContainerElement ContainerElement},
// {@link module:engine/view/emptyelement~EmptyElement EmptyElement} or
// {@link module:engine/view/uielement~UIElement UIElement}.
//
// Throws {@link module:utils/ckeditorerror~CKEditorError CKEditorError} `view-writer-insert-invalid-node` when nodes to insert
// contains instances that are not {@link module:engine/view/text~Text Texts},
// {@link module:engine/view/emptyelement~EmptyElement EmptyElements},
// {@link module:engine/view/uielement~UIElement UIElements},
// {@link module:engine/view/attributeelement~AttributeElement AttributeElements} or
// {@link module:engine/view/containerelement~ContainerElement ContainerElements}.
//
// @param Iterable.<module:engine/view/text~Text|module:engine/view/attributeelement~AttributeElement
// |module:engine/view/containerelement~ContainerElement> nodes
function validateNodesToInsert( nodes ) {
	for ( const node of nodes ) {
		if ( !validNodesToInsert.some( ( validNode => node instanceof validNode ) ) ) { // eslint-disable-line no-use-before-define
			/**
			 * Inserted nodes should be valid to insert. of {@link module:engine/view/attributeelement~AttributeElement AttributeElement},
			 * {@link module:engine/view/containerelement~ContainerElement ContainerElement},
			 * {@link module:engine/view/emptyelement~EmptyElement EmptyElement},
			 * {@link module:engine/view/uielement~UIElement UIElement}, {@link module:engine/view/text~Text Text}.
			 *
			 * @error view-writer-insert-invalid-node
			 */
			throw new CKEditorError( 'view-writer-insert-invalid-node' );
		}

		if ( !node.is( 'text' ) ) {
			validateNodesToInsert( node.getChildren() );
		}
	}
}

const validNodesToInsert = [ Text, AttributeElement, ContainerElement, EmptyElement, UIElement ];

// Checks if node is ContainerElement or DocumentFragment, because in most cases they should be treated the same way.
//
// @param {module:engine/view/node~Node} node
// @returns {Boolean} Returns `true` if node is instance of ContainerElement or DocumentFragment.
function isContainerOrFragment( node ) {
	return node && ( node.is( 'containerElement' ) || node.is( 'documentFragment' ) );
}

// Checks if {@link module:engine/view/range~Range#start range start} and {@link module:engine/view/range~Range#end range end} are placed
// inside same {@link module:engine/view/containerelement~ContainerElement container element}.
// Throws {@link module:utils/ckeditorerror~CKEditorError CKEditorError} `view-writer-invalid-range-container` when validation fails.
//
// @param {module:engine/view/range~Range} range
function validateRangeContainer( range ) {
	const startContainer = getParentContainer( range.start );
	const endContainer = getParentContainer( range.end );

	if ( !startContainer || !endContainer || startContainer !== endContainer ) {
		/**
		 * Range container is invalid. This can happen if {@link module:engine/view/range~Range#start range start} and
		 * {@link module:engine/view/range~Range#end range end} positions are not placed inside same container or
		 * parent container for these positions cannot be found.
		 *
		 * @error view-writer-invalid-range-container
		 */
		throw new CKEditorError( 'view-writer-invalid-range-container' );
	}
}
